import type { ReactNode } from "react";
import { SL, type LegState } from "../../lib/timeline";
import { Icon } from "../Icon";

export function Leg({
  state,
  node,
  title,
  children,
}: {
  state: LegState;
  node: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={`leg ${state}`}>
      <div className="node">
        <Icon name={node} />
      </div>
      <div className="panel">
        <div className="panel-h">
          <h3>{title}</h3>
          <span className="state">{SL[state]}</span>
        </div>
        {children}
      </div>
    </div>
  );
}
