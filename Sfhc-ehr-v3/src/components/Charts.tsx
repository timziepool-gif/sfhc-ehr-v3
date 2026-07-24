// Lightweight SVG-based charts (no external deps)

// ----------------------------------------------------------------------------
// Bar chart
// ----------------------------------------------------------------------------

export function BarChart({
  data,
  height = 200,
  color = "#0d9488",
  formatValue = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / Math.max(1, data.length);
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="w-full h-full">
        {data.map((d, i) => {
          const h = (d.value / max) * (height / 2 - 16);
          const x = i * barWidth + barWidth * 0.2;
          const w = barWidth * 0.6;
          const y = height / 2 - h - 12;
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx={1} fill={color} opacity={0.85} />
            </g>
          );
        })}
      </svg>
      <div className="flex items-end justify-around mt-1 text-[10px] text-slate-500 font-medium">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5" style={{ width: `${barWidth}%` }}>
            <span className="text-slate-700 tabular-nums">{formatValue(d.value)}</span>
            <span className="truncate max-w-full text-center" title={d.label}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Line chart (simple)
// ----------------------------------------------------------------------------

export function LineChart({
  data,
  height = 200,
  color = "#0d9488",
  formatValue = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = Math.max(1, max - min);
  const w = 100;
  const h = height / 2;
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = h - ((d.value - min) / range) * (h - 16) - 12;
    return { x, y, d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="w-full" style={{ height }}>
      <svg viewBox={`0 0 100 ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
        <defs>
          <linearGradient id="lc-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lc-grad)" />
        <path d={path} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={1.2} fill={color} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex items-end justify-between mt-1 text-[10px] text-slate-500 font-medium">
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-slate-700 tabular-nums">{formatValue(d.value)}</span>
            <span className="truncate">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Donut chart
// ----------------------------------------------------------------------------

export function DonutChart({
  data,
  size = 160,
  thickness = 18,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = Math.max(1, data.reduce((s, d) => s + d.value, 0));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
        {data.map((d, i) => {
          const dash = (d.value / total) * circumference;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return seg;
        })}
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 font-semibold" style={{ fontSize: size * 0.16 }}>
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
            <span className="text-slate-700 flex-1">{d.label}</span>
            <span className="text-slate-900 font-medium tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Progress bar
// ----------------------------------------------------------------------------

export function ProgressBar({
  value,
  max,
  tone = "teal",
  showLabel = false,
}: {
  value: number;
  max: number;
  tone?: "teal" | "amber" | "rose" | "blue";
  showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / Math.max(1, max)) * 100));
  const colorMap = {
    teal: "bg-teal-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    blue: "bg-blue-500",
  };
  return (
    <div className="w-full">
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${colorMap[tone]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}
