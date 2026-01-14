// Circlepot Push Notification Handlers
// This file is imported by the Workbox-generated service worker via importScripts

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  let notificationData = {
    title: "Circlepot Notification",
    body: "You have a new update",
    icon: "/pwa-192x192.png",
    badge: "/pwa-64x64.png",
    tag: "default",
    requireInteraction: false,
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.message || data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.type || data.tag || notificationData.tag,
        requireInteraction:
          data.requiresAction || data.priority === "high" || false,
        data: data, // Store full data for click handling
        actions: data.actions || [],
      };
    } catch (error) {
      // Parse error
      try {
        notificationData.body = event.data.text();
      } catch (textError) {
        // Text parse error
      }
    }
  }

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(notificationData.title, {
          body: notificationData.body,
          icon: notificationData.icon || "pwa-192x192.png",
          badge: notificationData.badge || "pwa-64x64.png",
          tag: notificationData.tag,
          requireInteraction: notificationData.requireInteraction,
          data: notificationData.data,
          actions: notificationData.actions,
          vibrate: [200, 100, 200],
          timestamp: Date.now(),
        });
      } catch (err) {
        // Notification failed
      }
    })()
  );
});

// Notification click event - handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Determine the URL to open
  let urlToOpen = "/";

  if (event.notification.data) {
    // Use action URL if provided
    if (
      event.notification.data.action &&
      event.notification.data.action.action
    ) {
      urlToOpen = event.notification.data.action.action;
    } else if (typeof event.notification.data.action === "string") {
      urlToOpen = event.notification.data.action;
    }
  }

  // Handle action button clicks
  if (event.action) {
    // Handle action button clicks
  }

  // Open the URL
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open with the right URL
        for (const client of clientList) {
          // Match based on the URL path
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }

        // Try to find any open window and navigate it
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }

        // Open a new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event - handle when notification is dismissed
self.addEventListener("notificationclose", (event) => {
  // You could track dismissals here for analytics
});

// Message event - handle messages from the app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Periodic background sync (Chrome/Edge only)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "Circlepot-notifications-sync") {
    event.waitUntil(checkForNewNotifications());
  }
});

/**
 * Check for new notifications from the server
 * This is called during periodic background sync
 */
async function checkForNewNotifications() {
  try {
    // Try to get API URL from IndexedDB or fallback
    const apiUrl = await getNotificationApiUrl();

    if (!apiUrl) {
      return;
    }

    // Fetch new notifications from backend
    const response = await fetch(`${apiUrl}/check`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const notifications = await response.json();

    // Show each notification
    for (const notification of notifications) {
      await self.registration.showNotification(notification.title, {
        body: notification.message,
        icon: notification.icon || "/pwa-192x192.png",
        badge: notification.badge || "/pwa-64x64.png",
        tag: notification.type || "periodic-sync",
        data: notification,
        requireInteraction: notification.priority === "high",
      });
    }
  } catch (error) {
    // Handle error
  }
}

/**
 * Get notification API URL from IndexedDB
 * This is set by the app when the user subscribes
 */
async function getNotificationApiUrl() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open("Circlepot-config", 1);

      request.onerror = () => {
        resolve(null);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("config")) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(["config"], "readonly");
        const store = transaction.objectStore("config");
        const getRequest = store.get("notificationApiUrl");

        getRequest.onsuccess = () => {
          resolve(getRequest.result?.value || null);
        };

        getRequest.onerror = () => {
          resolve(null);
        };
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("config")) {
          db.createObjectStore("config", { keyPath: "key" });
        }
      };
    } catch (error) {
      resolve(null);
    }
  });
}
