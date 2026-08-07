"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

export function FaviconUpdater() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings.favicon) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.favicon;
  }, [settings.favicon]);

  return null;
}
