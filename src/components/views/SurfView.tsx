import { Icon } from "../Icon";
import { ForecastStrip } from "../surf/ForecastStrip";
import { StatLine } from "../surf/StatLine";
import { TideChart } from "../surf/TideChart";
import { WaveBars } from "../surf/WaveBars";
import { Gauges } from "../surf/Gauges";

export function SurfView({ active }: { active: boolean }) {
  return (
    <section className={active ? "view active" : "view"} id="view-surf" aria-label="Surf">
      <div className="pad">
        <div className="media-band">
          <img src="/img/surf-clase.jpg" alt="Grupo de clase de surf en la playa de Laga" loading="lazy" />
          <div className="cap">
            <h3>Olas para aprender</h3>
            <p>Junio en el Cantábrico: mar pequeño, días larguísimos y agua que ya no corta. Perfecto para empezar.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h">
            <div className="badge">
              <Icon name="i-waves" />
            </div>
            <div>
              <h3>Clases</h3>
              <div className="where">Iniciación · escuela en la playa</div>
            </div>
          </div>
          <dl className="meta">
            <dt>
              <Icon name="i-cal" />
              Sesiones
            </dt>
            <dd>4 clases durante la estancia</dd>
            <dt>
              <Icon name="i-clock" />
              Antes
            </dt>
            <dd>estar 30 min antes para el material</dd>
            <dt>
              <Icon name="i-check" />
              Incluye
            </dt>
            <dd>tabla y neopreno en clase</dd>
          </dl>
          <table className="turnos">
            <caption>Turnos publicados por el camp · orientativos, el horario real lo fija el camp según la marea</caption>
            <thead>
              <tr>
                <th>Día</th>
                <th>1º</th>
                <th>2º</th>
                <th>3º</th>
                <th>4º</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Sáb 20</th>
                <td>10–12</td>
                <td>12–14</td>
                <td>14–16</td>
                <td>16–18</td>
              </tr>
              <tr>
                <th>Dom 21</th>
                <td>10–12</td>
                <td>12–14</td>
                <td>14–16</td>
                <td>16–18</td>
              </tr>
              <tr>
                <th>Lun 22</th>
                <td>11–13</td>
                <td>13–15</td>
                <td>15–17</td>
                <td>17–19</td>
              </tr>
              <tr>
                <th>Mar 23</th>
                <td>12–14</td>
                <td>14–16</td>
                <td>16–18</td>
                <td>18–20</td>
              </tr>
            </tbody>
          </table>
          <div className="note">
            <Icon name="i-info" /> Por ahora solo está fijada la 1ª clase: sáb 20, 17:00–19:00. El resto los confirma el
            camp según la marea.
          </div>
        </div>

        <h2 className="section-h" style={{ fontSize: "1.4rem", margin: "18px 0 4px" }}>
          Mar y tiempo
        </h2>
        <StatLine />
        <ForecastStrip />

        <TideChart />
        <WaveBars />
        <Gauges />

        <div className="avisos" id="avisosBlock" role="note">
          <div className="avisos-head">
            <Icon name="i-triangle-alert" /> Aviso amarillo por calor
          </div>
          <p className="avisos-body">
            Hay aviso amarillo por calor en la costa vasca (~29–30° en costa) hasta el 24 de junio. En Laga la costa es lo
            más suave: agua fresca y brisa. Hidratación y crema.
          </p>
          <a
            className="btn avisos-btn"
            target="_blank"
            rel="noopener"
            href="https://www.aemet.es/es/eltiempo/prediccion/avisos?k=pva"
          >
            <Icon name="i-triangle-alert" />
            Avisos AEMET · País Vasco
            <Icon name="i-ext" style={{ marginLeft: "auto" }} />
          </a>
        </div>

        <div className="actions">
          <a
            className="btn"
            target="_blank"
            rel="noopener"
            href="https://www.surf-forecast.com/breaks/Playade-Laga/forecasts/latest/six_day"
          >
            <Icon name="i-waves" />
            Surf-forecast
          </a>
          <a className="btn" target="_blank" rel="noopener" href="https://www.aemet.es/es/eltiempo/prediccion/playas/laga-4804802">
            <Icon name="i-sun" />
            AEMET
          </a>
        </div>
      </div>
    </section>
  );
}
