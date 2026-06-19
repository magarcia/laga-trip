import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ForecastContext, NowContext } from "./contexts";
import { parseNowParam } from "./lib/time";
import { useNow } from "./hooks/useNow";
import { useOnline } from "./hooks/useOnline";
import { useForecast } from "./hooks/useForecast";
import { Sprite } from "./components/Sprite";
import { Rail } from "./components/Rail";
import { TabBar } from "./components/TabBar";
import { OfflineBanner } from "./components/OfflineBanner";
import { UpdateToast } from "./components/UpdateToast";
import { Footer } from "./components/Footer";
import { HoyView } from "./components/views/HoyView";
import { RutaView } from "./components/views/RutaView";
import { SurfView } from "./components/views/SurfView";
import { DespensaView } from "./components/views/DespensaView";
import { MapaView } from "./components/views/MapaView";
import { TABS, type TabId } from "./components/nav";

function initialTab(): TabId {
  const hash = (location.hash || "").replace("#", "");
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : "hoy";
}

export function App() {
  const override = useMemo(() => parseNowParam(location.search), []);
  const now = useNow(override);
  const online = useOnline();
  const model = useForecast(override != null);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [showPast, setShowPast] = useState(false);

  // Load-bearing body selectors (body.show-past, body.is-offline). useLayoutEffect so they apply
  // before paint and never flash a frame late.
  useLayoutEffect(() => {
    document.body.classList.toggle("show-past", showPast);
  }, [showPast]);
  useLayoutEffect(() => {
    document.body.classList.toggle("is-offline", !online);
  }, [online]);

  const selectTab = useCallback((t: TabId) => {
    setTab(t);
    window.scrollTo({ top: 0 });
    if (history.replaceState) history.replaceState(null, "", "#" + t);
  }, []);

  return (
    <NowContext.Provider value={now}>
      <ForecastContext.Provider value={model}>
        <Sprite />
        <div className="app">
          <Rail tab={tab} onSelect={selectTab} />
          <main className="stage" id="stage">
            <OfflineBanner />
            {/* All 5 views always render; .active toggles display so the fade + class-only switch match today. */}
            <HoyView active={tab === "hoy"} />
            <RutaView active={tab === "ruta"} showPast={showPast} onTogglePast={() => setShowPast((p) => !p)} />
            <SurfView active={tab === "surf"} />
            <DespensaView active={tab === "despensa"} />
            <MapaView active={tab === "mapa"} />
            <Footer />
          </main>
          <TabBar tab={tab} onSelect={selectTab} />
          <UpdateToast />
        </div>
      </ForecastContext.Provider>
    </NowContext.Provider>
  );
}
