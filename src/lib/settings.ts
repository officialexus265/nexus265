"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteSettings, defaultSettings } from "@/types";

const STORAGE_KEY = "nexus265_settings";

function normalize(raw: Record<string, unknown>): SiteSettings {
  const social = (raw.social as SiteSettings["social"]) || defaultSettings.social;
  return {
    siteName: (raw.siteName as string) || defaultSettings.siteName,
    tagline: (raw.tagline as string) || defaultSettings.tagline,
    logo: (raw.logo as string) || "",
    heroImage: (raw.heroImage as string) || "",
    email: (raw.email as string) || defaultSettings.email,
    phone: (raw.phone as string) || defaultSettings.phone,
    whatsapp: (raw.whatsapp as string) || defaultSettings.whatsapp,
    social: { ...defaultSettings.social, ...social },
  };
}

export function loadSettings(): SiteSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return normalize(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export function saveSettingsLocal(settings: SiteSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event("nexus265-settings-updated"));
}

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Local first for instant UI
    setSettings(loadSettings());
    setReady(true);

    // Then try API (Phase 3 DB)
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const normalized = normalize(data);
          setSettings(normalized);
          saveSettingsLocal(normalized);
        }
      })
      .catch(() => {});

    const handler = () => setSettings(loadSettings());
    window.addEventListener("nexus265-settings-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nexus265-settings-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = useCallback(async (partial: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettingsLocal(next);
      // Persist to DB if available
      fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  return { settings, update, ready };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
