import { useNowValue } from "../../contexts";
import { B, lagaDay, legState } from "../../lib/timeline";
import { Icon } from "../Icon";
import { Leg } from "../ruta/Leg";

const LEG_TIMES = (
  [
    ["2026-06-19T23:00:00+02:00", "2026-06-20T07:00:00+02:00"],
    ["2026-06-20T07:00:00+02:00", "2026-06-20T14:00:00+02:00"],
    ["2026-06-20T14:00:00+02:00", "2026-06-23T17:00:00+02:00"],
    ["2026-06-23T17:00:00+02:00", "2026-06-24T10:30:00+02:00"],
    ["2026-06-24T10:30:00+02:00", "2026-06-24T18:00:00+02:00"],
  ] as const
).map(([s, e]) => [new Date(s), new Date(e)] as const);

interface RutaViewProps {
  active: boolean;
  showPast: boolean;
  onTogglePast: () => void;
}

export function RutaView({ active, showPast, onTogglePast }: RutaViewProps) {
  const now = useNowValue();
  const states = LEG_TIMES.map(([s, e]) => legState(s, e, now));
  const anyPast = states.some((s) => s === "past");
  const lagaWhere =
    now >= B.checkin && now < B.leaveLaga ? `Día ${lagaDay(now)} de 4 · surf y playa` : "3 noches · surf y playa";

  return (
    <section className={active ? "view active" : "view"} id="view-ruta" aria-label="Ruta">
      <div className="pad">
        <h2 className="section-h">La ruta</h2>
        <p className="section-sub">
          Barcelona al norte en bus nocturno, al agua en Laga, San Juan en Bilbao y vuelta. Lo de cada tramo se actualiza
          solo.
        </p>
        {anyPast && (
          <button className="toggle-past" onClick={onTogglePast}>
            <Icon name="i-chev" /> {showPast ? "Ocultar lo pasado" : "Ver también lo ya pasado"}
          </button>
        )}

        <div className="timeline">
          <Leg state={states[0]} node="i-bus" title="Bus al norte">
            <div className="where">Nocturno · Barcelona → Bilbao</div>
            <div className="legtimes">
              <span>
                23:00 <small>vie · Barcelona Nord</small>
              </span>
              <Icon name="i-chev" className="ic ar" />
              <span>
                07:00 <small>sáb · Bilbao Intermodal</small>
              </span>
            </div>
            <dl className="meta leg-extra">
              <dt>
                <Icon name="i-bus" />
                Salida
              </dt>
              <dd>Estació d'Autobusos Barcelona Nord, C/ Alí Bei 80, 08013 Barcelona</dd>
              <dt>
                <Icon name="i-pin" />
                Llegada
              </dt>
              <dd>Bilbao Intermodal, Gurtubay Kalea 1, 48013 Bilbao</dd>
            </dl>
            <div className="actions leg-extra">
              <a
                className="btn"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Estaci%C3%B3+d%27Autobusos+Barcelona+Nord%2C+C%2F+Al%C3%AD+Bei+80%2C+08013+Barcelona"
              >
                <Icon name="i-pin" />
                Barcelona Nord
              </a>
              <a
                className="btn"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao"
              >
                <Icon name="i-pin" />
                Bilbao Intermodal
              </a>
            </div>
            <div className="leg-extra note">
              <Icon name="i-ticket" /> Abono Único · llevar DNI · tabla embalada.
            </div>
          </Leg>

          <Leg state={states[1]} node="i-bus" title="Bilbao → Laga">
            <div className="where">Bizkaibus A3513 · ~1h46 puerta a puerta</div>
            <dl className="meta leg-extra">
              <dt>
                <Icon name="i-bus" />
                Subir
              </dt>
              <dd>Bilbao Intermodal, Gurtubay Kalea 1, 48013 Bilbao</dd>
              <dt>
                <Icon name="i-pin" />
                Bajar
              </dt>
              <dd>parada Elejalde 12, Ibarrangelu · ~1 min al hostel</dd>
              <dt>
                <Icon name="i-clock" />
                Frecuencia
              </dt>
              <dd>cada 2 h · check-in 14:00</dd>
            </dl>
            <div className="mapembed leg-extra">
              <iframe
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ruta en transporte público de Bilbao a Laga"
                src="https://maps.google.com/maps?saddr=Bilbao+Intermodal,+Gurtubay+Kalea+1,+48013+Bilbao&daddr=Laga+Surf+Camp+Hostel,+Elexalde+Auzoa+11,+48311+Elexalde&dirflg=r&output=embed"
              ></iframe>
            </div>
            <div className="actions leg-extra">
              <a
                className="btn btn-primary"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/dir/?api=1&origin=Bilbao+Intermodal%2C+Gurtubay+Kalea+1%2C+48013+Bilbao&destination=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde&travelmode=transit"
              >
                <Icon name="i-nav" />
                Ruta
              </a>
              <a className="btn" target="_blank" rel="noopener" href="https://www.bidaide.eus/es/route/map/Bizkaibus/3513">
                <Icon name="i-clock" />
                Horarios A3513
              </a>
            </div>
          </Leg>

          <Leg state={states[2]} node="i-waves" title="Días de Laga">
            <div className="where" id="lagaWhere">
              {lagaWhere}
            </div>
            <dl className="meta leg-extra">
              <dt>
                <Icon name="i-bed" />
                Hostel
              </dt>
              <dd>Laga Surf Camp, Elexalde Auzoa 11, 48311 Elexalde (Ibarrangelu). Litera, cocina y desayuno. Check-out 12:00.</dd>
              <dt>
                <Icon name="i-waves" />
                Surf
              </dt>
              <dd>iniciación · 3 clases · estar 30 min antes</dd>
            </dl>
            <div className="mapembed leg-extra">
              <iframe
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de Laga Surf Camp Hostel"
                src="https://maps.google.com/maps?q=Laga+Surf+Camp+Hostel,+Elexalde+Auzoa+11,+48311+Elexalde&output=embed"
              ></iframe>
            </div>
            <div className="actions leg-extra">
              <a
                className="btn btn-primary"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde"
              >
                <Icon name="i-pin" />
                Hostel
              </a>
              <a
                className="btn"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Playa+de+Laga%2C+Ibarrangelu%2C+Bizkaia"
              >
                <Icon name="i-nav" />
                Playa
              </a>
            </div>
          </Leg>

          <Leg state={states[3]} node="i-flame" title="Noche de San Juan">
            <div className="where">Laga → Bilbao · pintxos y hogueras</div>
            <div className="legtimes">
              <span>
                17:00 <small>mar · Laga</small>
              </span>
              <Icon name="i-chev" className="ic ar" />
              <span>
                ~18:45 <small>Bilbao</small>
              </span>
            </div>
            <dl className="meta leg-extra">
              <dt>
                <Icon name="i-bus" />
                Vuelta
              </dt>
              <dd>A3513 Laga → Bilbao Intermodal · ~1h46 · sale 17:00</dd>
              <dt>
                <Icon name="i-house" />
                Apartamento
              </dt>
              <dd>bcool, Fernández del Campo Kalea 6, 48010 Bilbao · metro y tren cerca</dd>
            </dl>
            <div className="mapembed leg-extra">
              <iframe
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ruta en transporte público de Laga a Bilbao"
                src="https://maps.google.com/maps?saddr=Laga+Surf+Camp+Hostel,+Elexalde+Auzoa+11,+48311+Elexalde&daddr=Fernández+del+Campo+Kalea+6,+48010+Bilbao&dirflg=r&output=embed"
              ></iframe>
            </div>
            <div className="actions leg-extra">
              <a
                className="btn btn-primary"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/dir/?api=1&origin=Laga+Surf+Camp+Hostel%2C+Elexalde+Auzoa+11%2C+48311+Elexalde&destination=Fern%C3%A1ndez+del+Campo+Kalea+6%2C+48010+Bilbao&travelmode=transit"
              >
                <Icon name="i-nav" />
                Ruta a Bilbao
              </a>
              <a
                className="btn"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Fern%C3%A1ndez+del+Campo+Kalea+6%2C+48010+Bilbao"
              >
                <Icon name="i-house" />
                Apartamento
              </a>
              <a
                className="btn"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Casco+Viejo%2C+Bilbao"
              >
                <Icon name="i-pin" />
                Casco Viejo
              </a>
            </div>
          </Leg>

          <Leg state={states[4]} node="i-bus" title="Vuelta a casa">
            <div className="where">Bilbao → Barcelona Sants</div>
            <div className="legtimes">
              <span>
                10:30 <small>mié · Bilbao Intermodal</small>
              </span>
              <Icon name="i-chev" className="ic ar" />
              <span>
                18:00 <small>Barcelona Sants</small>
              </span>
            </div>
            <dl className="meta leg-extra">
              <dt>
                <Icon name="i-bus" />
                Salida
              </dt>
              <dd>Bilbao Intermodal, Gurtubay Kalea 1, 48013 Bilbao</dd>
              <dt>
                <Icon name="i-pin" />
                Llegada
              </dt>
              <dd>Estació de Sants, Plaça dels Països Catalans, 08014 Barcelona</dd>
            </dl>
            <div className="actions leg-extra">
              <a
                className="btn"
                target="_blank"
                rel="noopener"
                href="https://www.google.com/maps/search/?api=1&query=Estaci%C3%B3+de+Sants%2C+Pla%C3%A7a+dels+Pa%C3%AFsos+Catalans%2C+08014+Barcelona"
              >
                <Icon name="i-pin" />
                Barcelona Sants
              </a>
            </div>
          </Leg>
        </div>
      </div>
    </section>
  );
}
