/** Compact donut with an inline legend. Click a segment/row to filter. */
export default function DonutChart({ segments, total, onSegmentClick, activeKey }) {
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  const stops = [];
  segments.reduce((offset, s) => {
    const end = offset + (s.value / sum) * 100;
    stops.push(`${s.color} ${offset}% ${end}%`);
    return end;
  }, 0);
  return (
    <div className="donut-wrap">
      <div
        className="donut"
        style={{ background: `conic-gradient(${stops.join(',')})` }}
        role="img"
        aria-label={`${total} invoices by channel`}
      >
        <span className="donut-center">
          <span className="donut-num">{total}</span>
          <span className="donut-lbl">Total</span>
        </span>
      </div>
      <div className="donut-legend">
        {segments.map((s) => {
          const pct = sum ? Math.round((s.value / sum) * 100) : 0;
          const active = activeKey === s.key;
          return (
            <button
              type="button"
              key={s.key}
              className={`legend-row${active ? ' active' : ''}`}
              onClick={onSegmentClick ? () => onSegmentClick(s.key) : undefined}
              title={`${s.value} invoices (${pct}%)${onSegmentClick ? ' — click to filter' : ''}`}
            >
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-name">{s.label}</span>
              <span className="legend-val">{s.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
