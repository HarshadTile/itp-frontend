export default function DonutChart({ segments, total, onSegmentClick, activeKey }) {
  const stops = [];
  segments.reduce((acc, s) => {
    const pct = total ? (s.value / total) * 100 : 0;
    stops.push(`${s.color} ${acc}% ${acc + pct}%`);
    return acc + pct;
  }, 0);
  return (
    <div className="donut-wrap">
      <div
        className="donut"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
        role="img"
        aria-label={`${total} invoices by status`}
      >
        <span className="donut-center">
          <span className="donut-num">{total}</span>
          <span className="donut-lbl">Total Invoices</span>
        </span>
      </div>
      <div style={{ marginTop: 16, width: '100%', maxWidth: 260 }}>
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
              {s.label}
              <span className="legend-val">{s.value} · {pct}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
