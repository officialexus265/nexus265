const CACHE = "nexus265-v1";
const PRECACHE = ["/", "/admin/chat", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => cached))
  );
});

// Notification click → open admin chat
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/admin/chat";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.postMessage({ type: "OPEN_CHAT", sessionId: event.notification.data?.sessionId });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});

// Allow page to show notification via SW (works better when tab in background)
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const { title, body, sessionId } = event.data;
    self.registration.showNotification(title || "New chat message", {
      body: body || "Someone needs help",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: sessionId || "nexus265-chat",
      renotify: true,
      requireInteraction: true,
      data: { url: "/admin/chat", sessionId },
      vibrate: [400, 200, 400, 200, 400, 200, 800],
    });
  }
});
