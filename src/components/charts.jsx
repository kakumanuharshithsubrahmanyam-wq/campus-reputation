export function LineChart({ data }) {
  const W = 560, H = 220, pad = { l: 40, r: 12, t: 12, b: 28 }
  const max = Math.ceil(Math.max(...data.map((d) => d.v)) / 400) * 400
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1)
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b)
  const pts = data.map((d, i) => `${x(i)},${y(d.v)}`).join(' ')
  const ticks = [0, max / 2, max]
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`CAMP Score from ${data[0].v} to ${data[data.length - 1].v}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E2E8F0" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748B">{t}</text>
        </g>
      ))}
      <polyline points={pts} fill="none" stroke="#4F46E5" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, i) => (
        <g key={d.m}>
          <circle cx={x(i)} cy={y(d.v)} r="3.5" fill="#fff" stroke="#4F46E5" strokeWidth="2"><title>{d.m}: {d.v}</title></circle>
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748B">{d.m}</text>
        </g>
      ))}
    </svg>
  )
}

const shades = ['#4F46E5', '#6D68EA', '#8F8BEF', '#B1AFF3', '#CFCEF7']

export function BarList({ data }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <div className="stack" style={{ gap: 14 }}>
      {data.map((d, i) => (
        <div className="bar-row" key={d.name}>
          <span className="sm sec">{d.name}</span>
          <div className="progress"><span style={{ width: `${(d.value / max) * 100}%`, background: shades[i] }} /></div>
          <span className="sm" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
        </div>
      ))}
    </div>
  )
}
