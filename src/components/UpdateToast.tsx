import { useEffect, useRef, useState } from "react";
import { registerSW } from "virtual:pwa-register";

// User-prompted SW update (registerType: "prompt" in vite.config). When a new build is precached,
// onNeedRefresh fires and we surface a dismissible toast instead of silently reloading mid-trip.
export function UpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const updateSW = useRef<((reload?: boolean) => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    updateSW.current = registerSW({
      immediate: true,
      onNeedRefresh: () => setNeedRefresh(true),
    });
  }, []);

  if (!needRefresh) return null;

  return (
    <div className="update-toast" role="status" aria-live="polite">
      <span className="update-toast-msg">Hay una actualización</span>
      <button type="button" className="update-toast-go" onClick={() => updateSW.current?.(true)}>
        Actualizar
      </button>
      <button
        type="button"
        className="update-toast-x"
        aria-label="Descartar"
        onClick={() => setNeedRefresh(false)}
      >
        &times;
      </button>
    </div>
  );
}
