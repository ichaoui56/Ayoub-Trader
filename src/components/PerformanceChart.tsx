"use client";

import { useState } from "react";

type Point = { label: string; total: number };

export default function PerformanceChart({ points, currency, period }: { points: Point[]; currency: string; period: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const width = 760;
  const height = 250;
  const left = 42;
  const right = 744;
  const top = 18;
  const bottom = 216;
  const values = points.map((point) => point.total);
  const low = Math.min(0, ...values);
  const high = Math.max(...values);
  const spread = high - low || 1;
  const coordinate = (value: number, index: number) => ({
    x: left + (index * (right - left)) / Math.max(1, points.length - 1),
    y: bottom - ((value - low) / spread) * (bottom - top),
  });
  const positions = points.map((point, index) => coordinate(point.total, index));
  const line = positions.map((position, index) => {
    if (!index) return `M ${position.x} ${position.y}`;
    const previous = positions[index - 1];
    const handle = (position.x - previous.x) / 2;
    return `C ${previous.x + handle} ${previous.y}, ${position.x - handle} ${position.y}, ${position.x} ${position.y}`;
  }).join(" ");
  const area = `${line} L ${right} ${bottom} L ${left} ${bottom} Z`;
  const active = activeIndex === null ? null : points[activeIndex];
  const activePosition = activeIndex === null ? null : coordinate(points[activeIndex].total, activeIndex);

  function updateActivePoint(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const chartX = ((event.clientX - bounds.left) / bounds.width) * width;
    const index = Math.round(((chartX - left) / (right - left)) * Math.max(1, points.length - 1));
    setActiveIndex(Math.max(0, Math.min(points.length - 1, index)));
  }

  return (
    <div className="dash-chart-wrap">
      <div className="dash-chart-legend"><span><i />Completed profit · {currency}</span><strong>{new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(values.reduce((sum, value) => sum + value, 0))}</strong></div>
      <div className="dash-chart-canvas">
        <svg className="dash-chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Recorded profit over ${period} in ${currency}`} onPointerMove={updateActivePoint} onPointerLeave={() => setActiveIndex(null)}>
          <defs>
            <linearGradient id="profit-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00D68F" stopOpacity=".27" /><stop offset="100%" stopColor="#00D68F" stopOpacity="0" /></linearGradient>
            <filter id="profit-point-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          {[0, 1, 2, 3, 4].map((step) => <g key={step}><line x1={left} x2={right} y1={top + step * ((bottom - top) / 4)} y2={top + step * ((bottom - top) / 4)} className="dash-chart-gridline" /><text x="0" y={top + step * ((bottom - top) / 4) + 4} className="dash-chart-axis-label">{new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(high - (step * (high - low)) / 4)}</text></g>)}
          <path d={area} fill="url(#profit-area-fill)" />
          <path d={line} className="dash-chart-line" />
          {points.map((point, index) => {
            const position = coordinate(point.total, index);
            return <circle key={`${point.label}-${index}`} cx={position.x} cy={position.y} r={activeIndex === index ? 5 : 3} className="dash-chart-point" filter={activeIndex === index ? "url(#profit-point-glow)" : undefined} />;
          })}
          {activePosition && <line x1={activePosition.x} x2={activePosition.x} y1={top} y2={bottom} className="dash-chart-crosshair" />}
        </svg>
        {active && <div className="dash-chart-tooltip" style={{ left: `${Math.min(92, Math.max(8, ((activePosition?.x ?? left) / width) * 100))}%` }}><strong>{new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(active.total)}</strong><span>{active.label}</span></div>}
      </div>
      <div className="dash-chart-range"><span>{points[0]?.label}</span><span>{points.at(-1)?.label}</span></div>
    </div>
  );
}