import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Native PWA Features
class PWAManager {
  private deferredPrompt: any = null;

  constructor() {
    this.initializePWA();
  }

  private initializePWA() {
    // Handle PWA install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      // Show both: custom button and default browser banner
      const promptEvent = e as any;
      this.deferredPrompt = promptEvent;

      // Show the default browser install banner immediately
      promptEvent.prompt();
    });

    // Handle successful PWA installation
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed successfully");
      this.deferredPrompt = null;
    });

    // Handle URL parameters for shortcuts
    this.handleURLActions();

    // Handle file opening (KML files)
    this.handleFileHandlers();

    // Handle geo: protocol
    this.handleGeoProtocol();

    // Set up native app behaviors
    this.setupNativeBehaviors();
  }

  public async installPWA() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;

      // Remove install button
      const button = document.getElementById("install-pwa-button");
      if (button) {
        button.remove();
      }
    }
  }

  private handleURLActions() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");

    // Dispatch custom events for URL actions
    if (action) {
      window.dispatchEvent(new CustomEvent("pwa-action", { detail: action }));
    }
  }

  private handleFileHandlers() {
    // Handle file opening if supported
    if ("launchQueue" in window) {
      (window as any).launchQueue.setConsumer((launchParams: any) => {
        if (launchParams.files && launchParams.files.length) {
          launchParams.files.forEach((fileHandle: any) => {
            // Dispatch file open event
            window.dispatchEvent(
              new CustomEvent("pwa-file-open", { detail: fileHandle })
            );
          });
        }
      });
    }
  }

  private handleGeoProtocol() {
    const urlParams = new URLSearchParams(window.location.search);
    const geo = urlParams.get("geo");

    if (geo) {
      // Parse geo coordinates and dispatch event
      const coords = geo.match(/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coords) {
        window.dispatchEvent(
          new CustomEvent("pwa-geo-open", {
            detail: { lat: parseFloat(coords[1]), lng: parseFloat(coords[2]) },
          })
        );
      }
    }
  }

  private setupNativeBehaviors() {
    // Prevent zoom on double tap (more app-like)
    document.addEventListener("touchstart", (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });

    // Handle back button in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches) {
      // Add native-like back button behavior
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || (e.altKey && e.key === "ArrowLeft")) {
          // Handle navigation back
          if (window.history.length > 1) {
            window.history.back();
          }
        }
      });
    }

    // Add native-like context menu prevention
    document.addEventListener("contextmenu", (e) => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        e.preventDefault();
      }
    });

    // Handle app visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        // App became visible - refresh location if needed
        window.dispatchEvent(new CustomEvent("pwa-app-visible"));
      }
    });
  }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Register Service Worker for PWA functionality
// Register Service Worker only in production (GitHub Pages or custom domain), not in localhost/dev
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Use Vite's import.meta.env.PROD to determine environment
    const swPath = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        // Handle service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Show update notification
                window.dispatchEvent(new CustomEvent("pwa-update-available"));
              }
            });
          }
        });
      })
      .catch(() => {
        console.log("SW registration failed");
      });
  });
}

// Enhanced permissions handling
if ("permissions" in navigator) {
  navigator.permissions.query({ name: "geolocation" }).then((result) => {
    // Listen for permission changes
    result.addEventListener("change", () => {
      window.dispatchEvent(
        new CustomEvent("pwa-permission-change", {
          detail: { permission: "geolocation", state: result.state },
        })
      );
    });
  });
}

// Expose PWA manager globally for app usage
(window as any).pwaManager = pwaManager;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
