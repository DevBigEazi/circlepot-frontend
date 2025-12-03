import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const dismissedUntil = localStorage.getItem("pwa-install-dismissed");
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    // Check if app is already installed
    if (isStandalone) {
      return;
    }

    // Check if dismissed and still within dismissal period
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      return;
    }

    // Clear expired dismissal
    if (dismissedUntil && Date.now() >= parseInt(dismissedUntil)) {
      localStorage.removeItem("pwa-install-dismissed");
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show the install prompt after a short delay (better UX)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }

      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error("Error during installation:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember that user dismissed the prompt (for 7 days)
    const dismissedUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem("pwa-install-dismissed", dismissedUntil.toString());
  };

  const handleNotNow = () => {
    setShowPrompt(false);
    // Don't set localStorage, so it can show again in the same session or next visit
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-4 md:px-0">
      <div className="md:mx-auto md:max-w-lg animate-slide-down-simple">
        <div className="bg-gradient-to-br from-primary/10 via-surface to-surface backdrop-blur-xl border border-primary/20 rounded-xl shadow-xl p-3">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-3.5 h-3.5 text-text-light" />
          </button>

          {/* Content */}
          <div className="flex items-center gap-3 pr-6">
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text mb-0.5">
                Install CirclePot
              </h3>
              <p className="text-xs text-text-light">
                Quick access & offline support
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="bg-gradient-to-r from-primary to-primary/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:shadow-md hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isInstalling ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Installing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Install</span>
                  </>
                )}
              </button>
              <button
                onClick={handleNotNow}
                className="px-2 py-1.5 rounded-lg text-xs font-medium text-text-light hover:bg-primary/5 transition-colors hidden sm:block"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
