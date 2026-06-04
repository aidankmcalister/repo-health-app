// t-charts.jsx — MIMICKED visualization cards. Static SVG in the Linear palette.
// These are frames + sample renderings; the user's real custom charts plug into
// the same .viz / .viz__plot containers.

const C_PRIMARY = '#f46a3c';   // --primary (orange)
const C_TEAL = '#1fb8a6';      // --accent-2
const C_BLUE = '#4ea7fc';
const C_PURPLE = '#b59aff';

const _hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; } return h; };
const _rand = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
function series(key, n, base, trend, vol) {
  const r = _rand(_hash(key)); const out = []; let v = base;
  for (let i = 0; i < n; i++) { v += (r() - 0.45) * vol + trend; v = Math.max(2, v); out.push(v); }
  return out;
}
function smooth(pts) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

// ---- Big number ----
function BigNumber({ name = 'Open pull requests', value = '128', cap = 'Total · last 30 days', delta = 8.4, color = C_PRIMARY, seed = 'pr', chart = true }) {
  const data = series(seed, 32, 30, 0.4, 5);
  const w = 520, h = 120, min = Math.min(...data), max = Math.max(...data), rng = Math.max(1, max - min);
  const pts = data.map((y, i) => [(i / (data.length - 1)) * w, 14 + (1 - (y - min) / rng) * (h - 20)]);
  const gid = 'bn' + seed;
  if (!chart) {
    return (
      <div className="viz" style={{ width: '100%', minHeight: 168, display: 'flex', flexDirection: 'column' }}>
        <div className="viz__head"><div className="viz__name">{name}</div><Change value={delta} /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '14px 0 4px' }}>
          <div className="viz__big" style={{ margin: '0 0 6px' }}>{value}</div>
          <div className="viz__cap">{cap}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="viz" style={{ width: '100%' }}>
      <div className="viz__head">
        <div><div className="viz__name">{name}</div></div>
        <Change value={delta} />
      </div>
      <div className="viz__big">{value}</div>
      <div className="viz__cap">{cap}</div>
      <div className="viz__plot">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
          <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.28" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
          <path d={smooth(pts) + ` L${w},${h} L0,${h} Z`} fill={`url(#${gid})`} />
          <path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ---- Multi-series line / area ----
function SeriesChart({ name = 'PR throughput', kind = 'line', sub = 'last 90 days', seriesDefs }) {
  const defs = seriesDefs || [
    { label: 'prisma/prisma', color: C_PRIMARY, seed: 'a' },
    { label: 'vercel/next.js', color: C_BLUE, seed: 'b' },
  ];
  const n = 30, W = 560, H = 200, padL = 30, padR = 12, padT = 12, padB = 22;
  const all = defs.map(d => series(d.seed + kind, n, 30 + d.seed.charCodeAt(0) % 20, 0.2, 5));
  const flat = all.flat(); const max = Math.max(...flat) * 1.1, min = 0;
  const xAt = (i) => padL + (i / (n - 1)) * (W - padL - padR);
  const yAt = (v) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const ticks = [0, 1, 2, 3, 4].map(i => Math.round(max / 4 * i));
  return (
    <div className="viz" style={{ width: '100%' }}>
      <div className="viz__head">
        <div><div className="viz__name">{name}</div><div className="viz__sub">{sub}</div></div>
      </div>
      <div className="viz__plot" style={{ height: 200, margin: '14px -8px 0' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {ticks.map((t, i) => <g key={i}><line className="viz__gridline" x1={padL} x2={W - padR} y1={yAt(t)} y2={yAt(t)} vectorEffect="non-scaling-stroke" /><text className="viz__axis" x={padL - 5} y={yAt(t) + 3} textAnchor="end">{t}</text></g>)}
          {MONTHS.map((m, i) => <text key={m} className="viz__axis" x={padL + (i / (MONTHS.length - 1)) * (W - padL - padR)} y={H - 6} textAnchor="middle">{m}</text>)}
          {kind === 'area' && all.map((s, di) => {
            const pts = s.map((y, i) => [xAt(i), yAt(y)]); const gid = 'ar' + di + defs[di].seed;
            return <g key={'a' + di}><defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={defs[di].color} stopOpacity="0.26" /><stop offset="100%" stopColor={defs[di].color} stopOpacity="0" /></linearGradient></defs><path d={smooth(pts) + ` L${xAt(n - 1)},${yAt(0)} L${xAt(0)},${yAt(0)} Z`} fill={`url(#${gid})`} /></g>;
          })}
          {all.map((s, di) => { const pts = s.map((y, i) => [xAt(i), yAt(y)]); return <path key={di} d={smooth(pts)} fill="none" stroke={defs[di].color} strokeWidth={di === 0 ? 2 : 1.7} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />; })}
        </svg>
      </div>
      <div className="viz__legend">{defs.map(d => <span key={d.label} className="viz__lg"><span className="ln" style={{ background: d.color }} />{d.label}</span>)}</div>
    </div>
  );
}

// ---- Bar ----
function BarChart({ name = 'Commits per week', sub = 'grouped · last 12w' }) {
  const n = 12, W = 560, H = 200, padL = 30, padR = 12, padT = 12, padB = 22;
  const a = series('barA', n, 28, 0.2, 8), b = series('barB', n, 18, 0.3, 6);
  const max = Math.max(...a, ...b) * 1.1;
  const step = (W - padL - padR) / n, bw = Math.min(9, step * 0.32);
  const yAt = (v) => padT + (1 - v / max) * (H - padT - padB);
  const ticks = [0, 1, 2, 3, 4].map(i => Math.round(max / 4 * i));
  return (
    <div className="viz" style={{ width: '100%' }}>
      <div className="viz__head"><div><div className="viz__name">{name}</div><div className="viz__sub">{sub}</div></div></div>
      <div className="viz__plot" style={{ height: 200, margin: '14px -8px 0' }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {ticks.map((t, i) => <g key={i}><line className="viz__gridline" x1={padL} x2={W - padR} y1={yAt(t)} y2={yAt(t)} vectorEffect="non-scaling-stroke" /><text className="viz__axis" x={padL - 5} y={yAt(t) + 3} textAnchor="end">{t}</text></g>)}
          {a.map((v, i) => {
            const x = padL + i * step + step / 2;
            return <g key={i}>
              <rect x={x - bw - 1} y={yAt(v)} width={bw} height={yAt(0) - yAt(v)} fill={C_PRIMARY} opacity="0.9" rx="1" />
              <rect x={x + 1} y={yAt(b[i])} width={bw} height={yAt(0) - yAt(b[i])} fill={C_BLUE} opacity="0.9" rx="1" />
            </g>;
          })}
        </svg>
      </div>
      <div className="viz__legend"><span className="viz__lg"><span className="ln" style={{ background: C_PRIMARY }} />Authored</span><span className="viz__lg"><span className="ln" style={{ background: C_BLUE }} />Merged</span></div>
    </div>
  );
}

// ---- World map (mimic) ----
const MAP_BLOBS = [
  // crude continent rectangles in a 360x180 equirect space [x,y,w,h,intensity]
  [40, 38, 46, 30, 0.9], [70, 30, 18, 14, 0.7], // N America
  [78, 78, 30, 46, 0.5],                          // S America
  [165, 36, 36, 26, 1.0], [172, 28, 16, 10, 0.8], // Europe
  [175, 66, 52, 54, 0.45],                         // Africa
  [205, 30, 90, 44, 0.6], [250, 70, 30, 20, 0.5], // Asia
  [285, 110, 30, 22, 0.55],                        // Australia
];
function WorldMap({ name = 'Contributor reach', value = '148', cap = 'countries · last 30 days', delta = -3.1 }) {
  const lerp = (t) => `color-mix(in srgb, var(--primary) ${Math.round(18 + t * 70)}%, var(--surface-3))`;
  return (
    <div className="viz" style={{ width: '100%' }}>
      <div className="viz__head">
        <div><div className="viz__name">{name}</div><div className="viz__big" style={{ fontSize: 36, margin: '10px 0 3px' }}>{value}</div><div className="viz__cap">{cap}</div></div>
        <Change value={delta} />
      </div>
      <div className="mapcard__host">
        <svg viewBox="0 12 360 150" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 14 }).map((_, r) => Array.from({ length: 30 }).map((__, c) => (
            <circle key={r + '-' + c} cx={6 + c * 12} cy={20 + r * 10} r="0.9" fill="var(--hairline-strong)" />
          )))}
          {MAP_BLOBS.map((b, i) => (
            <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="6" fill={lerp(b[4])} stroke="color-mix(in srgb, var(--primary) 40%, transparent)" strokeWidth="0.5" opacity="0.92" />
          ))}
        </svg>
      </div>
    </div>
  );
}

Object.assign(window, { BigNumber, SeriesChart, BarChart, WorldMap });
