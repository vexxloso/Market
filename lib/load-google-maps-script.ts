/** Loads Maps JS API with Places once (callback pattern). */

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

export const GOOGLE_MAPS_SETUP_HELP =
  "Enable Maps JavaScript API, Places API, and Geocoding API for this key; billing must be active. " +
  "If the key has “API restrictions”, add your website restriction or use localhost referrers: " +
  "http://localhost:3000/* and http://127.0.0.1:3000/*. " +
  "https://developers.google.com/maps/documentation/javascript/error-messages#api-not-activated-map-error";

function removeMapsScriptsNotMatchingKey(apiKey: string) {
  document
    .querySelectorAll<HTMLScriptElement>('script[src*="maps.googleapis.com/maps/api/js"]')
    .forEach((el) => {
      const src = el.getAttribute("src") ?? "";
      if (!src.includes(apiKey)) el.remove();
    });
}

/**
 * After the bootstrap script runs, Places may load via `libraries=places` or `importLibrary`.
 */
async function ensurePlacesReady(): Promise<void> {
  if (window.google?.maps?.places) return;

  const maps = window.google?.maps;
  if (maps && typeof maps.importLibrary === "function") {
    await maps.importLibrary("places");
  }

  if (!window.google?.maps?.places) {
    throw new Error(
      `Google Maps loaded but Places did not. Enable “Places API” (or “Places API (New)”) for this key. ${GOOGLE_MAPS_SETUP_HELP}`,
      );
  }
}

function mapDivShowsGoogleFailure(map: google.maps.Map): boolean {
  try {
    const root = map.getDiv();
    const text = (root.innerText ?? "").toLowerCase();
    return (
      text.includes("can't load google maps") ||
      text.includes("cannot load google maps") ||
      text.includes("didn't load google maps") ||
      text.includes("this page can't load google maps") ||
      text.includes("something went wrong") ||
      text.includes("oops!") ||
      text.includes("api not activated") ||
      text.includes("for development purposes only")
    );
  } catch {
    return false;
  }
}

/**
 * Run code that constructs a `google.maps.Map`. After `idle`, briefly polls the map UI for Google’s
 * “could not load” overlay (e.g. ApiNotActivatedMapError often doesn’t call `gm_authFailure`).
 */
export function runWithGoogleMapsAuthGuard(
  init: () => google.maps.Map | void,
  options?: { idleTimeoutMs?: number },
): Promise<void> {
  const idleTimeoutMs = options?.idleTimeoutMs ?? 15000;
  return new Promise((resolve, reject) => {
    const prev = window.gm_authFailure;
    let settled = false;
    const cleanup = () => {
      window.gm_authFailure = prev;
    };
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (err) reject(err);
      else resolve();
    };

    window.gm_authFailure = () => {
      finish(
        new Error(
          `Google Maps could not validate this API key (gm_authFailure). ${GOOGLE_MAPS_SETUP_HELP}`,
        ),
      );
    };

    let map: google.maps.Map | undefined;
    try {
      const result = init();
      if (result) map = result;
    } catch (e) {
      finish(e instanceof Error ? e : new Error(String(e)));
      return;
    }

    if (map) {
      const t = window.setTimeout(() => {
        finish(
          new Error(
            `Google Maps did not finish loading (timeout). Check API enablement and key restrictions. ${GOOGLE_MAPS_SETUP_HELP}`,
          ),
        );
      }, idleTimeoutMs);

      const doneOk = () => {
        window.clearTimeout(t);
        finish();
      };

      google.maps.event.addListenerOnce(map, "idle", () => {
        let checks = 0;
        const iv = window.setInterval(() => {
          checks++;
          if (mapDivShowsGoogleFailure(map!)) {
            window.clearInterval(iv);
            window.clearTimeout(t);
            finish(
              new Error(
                `Google Maps failed to display (often ApiNotActivatedMapError or billing). ${GOOGLE_MAPS_SETUP_HELP}`,
              ),
            );
          } else if (checks >= 40) {
            window.clearInterval(iv);
            doneOk();
          }
        }, 200);
      });
      return;
    }

    window.setTimeout(() => finish(), 0);
  });
}

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Maps only in browser."));
  }

  const key = apiKey.trim();
  if (!key) {
    return Promise.reject(new Error("Missing Google Maps API key."));
  }

  removeMapsScriptsNotMatchingKey(key);

  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    'script[src*="maps.googleapis.com/maps/api/js"]',
  );

  if (existing) {
    return new Promise((resolve, reject) => {
      const done = async () => {
        try {
          await ensurePlacesReady();
          resolve();
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      };
      if (window.google?.maps?.places) {
        void done();
        return;
      }
      existing.addEventListener("load", () => void done(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps script failed to load.")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const cbName = `__staylyGmaps_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    (window as unknown as Record<string, () => void>)[cbName] = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      void (async () => {
        try {
          await ensurePlacesReady();
          resolve();
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      })();
    };

    const s = document.createElement("script");
    s.async = true;
    s.defer = true;
    // Do not use loading=async — it can interfere with the callback on some setups.
    s.src =
      `https://maps.googleapis.com/maps/api/js` +
      `?key=${encodeURIComponent(key)}` +
      `&libraries=places` +
      `&v=weekly` +
      `&callback=${cbName}`;

    s.onerror = () => {
      delete (window as unknown as Record<string, unknown>)[cbName];
      reject(new Error("Could not load Google Maps script (network or blocked)."));
    };
    document.head.appendChild(s);
  });
}
