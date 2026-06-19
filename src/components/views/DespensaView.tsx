import { Icon } from "../Icon";

export function DespensaView({ active }: { active: boolean }) {
  return (
    <section className={active ? "view active" : "view"} id="view-despensa" aria-label="Despensa">
      <div className="pad">
        <h2 className="section-h">La despensa</h2>
        <p className="section-sub">
          Cocinamos en grupo y el camp está aislado, así que la compra fuerte la hacemos en Bilbao. Esto es lo que tenemos
          para cubrir unas 3 o 4 comidas y 3 cenas.
        </p>

        <div className="panel">
          <div className="pantry">
            <section className="pgroup">
              <h3 className="pgroup-h">
                <Icon name="i-basket" /> Básicos y despensa
              </h3>
              <ul className="plist">
                <li>Aceite de oliva</li>
                <li>Arroz</li>
                <li>Pasta</li>
                <li>Salsa boloñesa</li>
                <li>Tomate seco</li>
                <li>
                  Caldo de pollo <span className="opt">· pastillas</span>
                </li>
                <li>Sal y pimienta</li>
              </ul>
            </section>

            <section className="pgroup">
              <h3 className="pgroup-h">
                <Icon name="i-carrot" /> Verduras
              </h3>
              <ul className="plist">
                <li>Calabacines</li>
                <li>
                  Pimientos de freír <span className="opt">· extra</span>
                </li>
                <li>Cebolla para cocinar</li>
                <li>
                  Tomate <span className="opt">×1</span>
                </li>
              </ul>
            </section>

            <section className="pgroup">
              <h3 className="pgroup-h">
                <Icon name="i-flame" /> Proteína
              </h3>
              <ul className="plist">
                <li>Pollo</li>
                <li>
                  Huevos <span className="opt">×12</span>
                </li>
                <li>
                  Setas deshidratadas <span className="opt">· para el risotto</span>
                </li>
                <li>
                  Grana Padano DOP rallado <span className="opt">×2</span>
                </li>
                <li>
                  Cada uno su lata <span className="opt">· bonito, melva o atún</span>
                </li>
              </ul>
            </section>

            <section className="pgroup">
              <h3 className="pgroup-h">
                <Icon name="i-utensils" /> Para picar
              </h3>
              <ul className="plist">
                <li>Mix de frutos secos</li>
                <li>Fuet sin pimienta</li>
                <li>
                  Plátano de Canarias <span className="opt">×6</span>
                </li>
              </ul>
            </section>

            <section className="pgroup">
              <h3 className="pgroup-h">
                <Icon name="i-croissant" /> Desayuno
              </h3>
              <ul className="plist">
                <li>Incluido en el hostel</li>
                <li>
                  Pan <span className="opt">· opcional</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="note">
            <Icon name="i-croissant" /> Desayuno incluido. Agua del grifo OK. Llevar bolsa de tela para cargar la compra.
          </div>
          <div className="actions">
            <a className="btn btn-primary" target="_blank" rel="noopener" href="https://www.splitwise.com/join/BoSH9yQFKMY+sn5nd?v=e">
              <Icon name="i-wallet" />
              Splitwise del grupo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
