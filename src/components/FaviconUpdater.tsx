"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/settings";

export function FaviconUpdater() {
  const { settings, ready } = useSettings();

  useEffect(() => {
    if (!ready) return;
    const href = settings.favicon;
    if (!href) return;

    // Remove existing icon links so Cloudinary favicon wins over /favicon.ico
    document
      .querySelectorAll("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']")
      .forEach((el) => el.remove());

    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    // bust cache when URL changes
    if (!href.startsWith("data:")) {
      link.href = href.includes("?") ? `${href}&v=${Date.now()}` : `${href}?v=${Date.now()}`;
    }
    document.head.appendChild(link);

    const apple = document.createElement("link");
    apple.rel = "apple-touch-icon";
    apple.href = href;
    document.head.appendChild(apple);
  }, [settings.favicon, ready]);

  return null;
}
