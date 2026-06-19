import { Hero } from "../hoy/Hero";
import { Ribbon } from "../hoy/Ribbon";
import { NextDeparture } from "../hoy/NextDeparture";
import { TodayCard } from "../hoy/TodayCard";

export function HoyView({ active }: { active: boolean }) {
  return (
    <section className={active ? "view active" : "view"} id="view-hoy" aria-label="Hoy">
      <Hero />
      <div className="hoy-sheet">
        <Ribbon />
        <div className="pad">
          <NextDeparture />
          <TodayCard />
        </div>
      </div>
    </section>
  );
}
