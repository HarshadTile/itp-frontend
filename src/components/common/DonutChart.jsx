export default function DonutChart({ segments, total, onSegmentClick, activeKey }) {
  const stops = [];
  segments.reduce((acc, s) => {
    const pct = total ? (s.value / total) * 100 : 0;
    stops.push(`${s.color} ${acc}% ${acc + pct}%`);
    return acc + pct;
  }, 0);
  return (
    <div style={{ textAlign: 'left' }}>
      <div className="donut" style={{ background: `conic-gradient(${stops.join(', ')})`, margin: '0 auto' }}>
        <span>{total}</span>
      </div>
      <div style={{ marginTop: 14, fontSize: 12 }}>
        {segments.map((s) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0;
          const active = activeKey === s.key;
          return (
            <button
              type="button"
              key={s.key}
              className={`legend-row${active ? ' active' : ''}`}
              onClick={onSegmentClick ? () => onSegmentClick(s.key) : undefined}
              title={`${s.value} invoices (${pct}%): click to filter`}
            >
              <span className="legend-dot" style={{ background: s.color }} />
              {s.label} ({s.value})
            </button>
          );
        })}
      </div>
    </div>
  );
}
