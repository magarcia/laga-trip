import { useForecastModel } from "../../contexts";
import { Icon } from "../Icon";

export function Gauges() {
  const { conditions } = useForecastModel();
  return (
    <div className="panel" id="gaugePanel">
      <div className="panel-h">
        <div className="badge">
          <Icon name="i-thermo" />
        </div>
        <div>
          <h3>Condiciones</h3>
          <div className="where">Resumen de la ventana</div>
        </div>
      </div>
      <div className="gauges">
        <div className="gauge">
          <Icon name="i-clock" className="ic gauge-ic" />
          <div className="gauge-v mono">
            {conditions.periodText}
            <small> s</small>
          </div>
          <div className="gauge-k">Periodo</div>
        </div>
        <div className="gauge">
          <Icon name="i-wind" className="ic gauge-ic" />
          <div className="gauge-v">{conditions.windText}</div>
          <div className="gauge-k">Viento · NW/NE mañanas</div>
        </div>
        <div className="gauge">
          <Icon name="i-drop" className="ic gauge-ic" />
          <div className="gauge-v mono">
            {conditions.waterText}
            <small>°</small>
          </div>
          <div className="gauge-k">Agua</div>
        </div>
        <div className="gauge">
          <Icon name="i-sun" className="ic gauge-ic" />
          <div className="gauge-v mono">{conditions.uvText}</div>
          <div className="gauge-k">Crema sí o sí</div>
        </div>
      </div>
    </div>
  );
}
