
import React from "react";

interface Props {
  violation?: boolean;
  label?: string;
  children: React.ReactNode; // your dot element(s)
  cx?: number;
  cy?: number;
  r?: number;
}

/**
 * Robust badge overlay for device markers.
 * - If cx/cy/r provided, uses those.
 * - Else, tries child props cx/cy/r, then data-x/data-y/data-r.
 * - Works even if child is wrapped in <g> or transformed.
 */
export const DeviceBadge: React.FC<Props> = ({ violation, label, children, cx, cy, r }) => {
  const { x, y, rad } = extractPos(children, cx, cy, r);
  const name = label ?? "device";

  if (!violation) {
    return <g aria-label={name}>{children}</g>;
  }

  return (
    <g aria-label={name + " (no-go)"} className="violation-shake">
      {/* overlay group positioned by translate */}
      <g transform={`translate(${x}, ${y})`}>
        {/* pulse ring */}
        <circle cx={0} cy={0} r={(rad || 3) * 2.4} className="violation-pulse" />
        {/* red flag */}
        <line x1={(rad || 3) + 1} y1={-(rad || 3) - 1} x2={(rad || 3) + 1} y2={-(rad || 3) - 7} stroke="red" strokeWidth={1.2} />
        <polygon points={`${(rad || 3) + 1},${-(rad || 3) - 7} ${(rad || 3) + 7},${-(rad || 3) - 4.5} ${(rad || 3) + 1},${-(rad || 3) - 2}`} fill="red" />
      </g>
      {/* original marker on top */}
      {children}
    </g>
  );
};

function extractPos(child: React.ReactNode, cx?: number, cy?: number, r?: number) {
  if (typeof cx === "number" && typeof cy === "number") {
    return { x: cx, y: cy, rad: typeof r === "number" ? r : 3 };
  }
  if (React.isValidElement(child)) {
    // Single element case
    const el: any = child;
    const px = pickNumber(el.props.cx, el.props["data-x"]);
    const py = pickNumber(el.props.cy, el.props["data-y"]);
    const pr = pickNumber(el.props.r, el.props["data-r"], 3);
    if (isFinite(px) && isFinite(py)) return { x: px, y: py, rad: pr };
    // If it's a group with children, try first child
    const kids = React.Children.toArray(el.props.children);
    for (const k of kids) {
      if (React.isValidElement(k)) {
        const kx = pickNumber((k as any).props.cx, (k as any).props["data-x"]);
        const ky = pickNumber((k as any).props.cy, (k as any).props["data-y"]);
        const kr = pickNumber((k as any).props.r, (k as any).props["data-r"], 3);
        if (isFinite(kx) && isFinite(ky)) return { x: kx, y: ky, rad: kr };
      }
    }
  }
  return { x: 0, y: 0, rad: typeof r === "number" ? r : 3 };
}

function pickNumber(...vals: any[]) {
  for (const v of vals) {
    const n = Number(v);
    if (isFinite(n)) return n;
  }
  return NaN;
}
