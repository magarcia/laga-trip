import { Icon } from "./Icon";

// Always in the DOM; visibility is driven by body.is-offline (set in App from useOnline).
export function OfflineBanner() {
  return (
    <div className="offline">
      <Icon name="i-info" style={{ verticalAlign: "-.18em" }} /> Sin conexión · datos guardados
    </div>
  );
}
