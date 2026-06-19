import { useForecastModel } from "../../contexts";
import { Icon } from "../Icon";

export function StatLine() {
  const { conditions } = useForecastModel();
  return (
    <div className="statline" style={{ margin: "8px 0 14px" }}>
      <div className="stat">
        <div className="v">{conditions.waterText}°</div>
        <div className="k">
          <Icon name="i-drop" />
          Agua
        </div>
      </div>
      <div className="stat">
        <div className="v">{conditions.uvText}</div>
        <div className="k">
          <Icon name="i-sun" />
          Crema sí o sí
        </div>
      </div>
      <div className="stat">
        <div className="v">{conditions.windText}</div>
        <div className="k">
          <Icon name="i-wind" />
          Viento
        </div>
      </div>
    </div>
  );
}
