import { useForecastModel } from "../../contexts";
import { Icon } from "../Icon";
import { DirArrow } from "./DirArrow";
import { cleanlinessLabel } from "./surfCopy";

export function Gauges() {
  const { conditions } = useForecastModel();
  const cleanWord = cleanlinessLabel(conditions.windCleanliness);
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
          <div className="gauge-sub">
            <DirArrow fromDeg={conditions.swellDirDeg} title={`Mar de fondo del ${conditions.swellDirLabel}`} />
            <span className="mono">{conditions.swellDirLabel}</span>
            <span>mar de fondo</span>
          </div>
        </div>
        <div className="gauge">
          <Icon name="i-wind" className="ic gauge-ic" />
          <div className="gauge-v">{conditions.windText}</div>
          <div className="gauge-k gauge-wind-k">
            <DirArrow fromDeg={conditions.windDirDeg} title={`Viento del ${cleanWord}`} />
            {cleanWord}
          </div>
        </div>
        <div className="gauge">
          <Icon name="i-drop" className="ic gauge-ic" />
          <div className="gauge-v mono">
            {conditions.waterText}
            <small>°</small>
          </div>
          <div className="gauge-k">Agua</div>
          {conditions.waterSource === "portus" && <div className="gauge-credit">Fuente: Puertos del Estado</div>}
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
