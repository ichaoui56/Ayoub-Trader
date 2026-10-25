"use client";

import { useState } from "react";
import { ROUTES, type RouteMode } from "../content";

const PATHS: Record<RouteMode, string> = {
  sea: "M40 170 C 160 90, 240 230, 400 150 S 640 90, 760 150",
  air: "M40 190 C 200 20, 600 20, 760 190",
  land: "M40 170 L 220 170 L 300 100 L 520 100 L 600 170 L 760 170",
};
const MID: Record<RouteMode, [number, number]> = { sea: [400, 150], air: [400, 50], land: [410, 100] };

export default function RouteExplorer() {
  const [mode, setMode] = useState<RouteMode>("sea");
  const r = ROUTES[mode];
  const [mx, my] = MID[mode];

  return (
    <section id="perspective" aria-labelledby="route-h" className="px-5 pb-24 md:px-[4vw] md:pb-36">
      <div className="bg-paper p-6 md:p-12">
        <p className="text-sm">Choose a perspective</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <h3 id="route-h" className="max-w-[14ch] font-display text-[clamp(1.9rem,4vw,3.5rem)] font-extrabold leading-[1] tracking-tight">Every route. A different rhythm.</h3>
          <div role="group" aria-label="Transport mode" className="flex border border-ink">
            {(Object.keys(ROUTES) as RouteMode[]).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={mode === k}
                onClick={() => setMode(k)}
                className={`on-light px-4 py-2.5 text-sm font-semibold ${mode === k ? "bg-ink text-paper" : "hover:bg-cloud"}`}
              >
                {ROUTES[k].tab}
              </button>
            ))}
          </div>
        </div>

        <svg viewBox="0 0 800 240" role="img" aria-label={`Illustrative ${r.tab.toLowerCase()} route from ${r.from} to ${r.to}`} className="mt-10 w-full">
          <path key={mode} d={PATHS[mode]} pathLength={1} fill="none" stroke="var(--color-signal)" strokeWidth="3" strokeLinejoin="round" className="route-draw" />
          <circle cx="40" cy={mode === "air" ? 190 : 170} r="9" fill="var(--color-ink)" />
          <circle cx="760" cy={mode === "air" ? 190 : mode === "sea" ? 150 : 170} r="9" fill="var(--color-ink)" />
          <circle cx={mx} cy={my} r="6" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="3" />
          <text x={mx} y={my - 16} textAnchor="middle" fontSize="15" fill="var(--color-ink)">{r.via}</text>
        </svg>

        <div className="mt-2 flex justify-between gap-4 font-display text-sm font-extrabold uppercase tracking-wide md:text-base">
          <span>{r.from}</span><span className="text-right">{r.to}</span>
        </div>

        <p aria-live="polite" className="mt-8 max-w-lg text-lg">{r.copy}</p>
        <p className="mt-4 text-sm text-ink/70">Illustrative journey · not live tracking</p>
      </div>
    </section>
  );
}
