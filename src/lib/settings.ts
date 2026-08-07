"use client";

import { useState, useEffect, useCallback } from "react";
import { SiteSettings, defaultSettings } from "@/types";

const STORAGE_KEY = "nexus265_settings";

export function loadSettings(): SiteSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SiteSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  // Notify other components in the same tab
  window.dispatchEvent(new Event("nexus265-settings-updated"));
}

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setReady(true);

    const handler = () => setSettings(loadSettings());
    window.addEventListener("nexus265-settings-updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nexus265-settings-updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = useCallback((partial: Partial<SiteSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update, ready };
}

/** Convert uploaded file to data URL (works offline, no Cloudinary needed yet) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
