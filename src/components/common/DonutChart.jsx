/** Status breakdown as a horizontal bar list — matches BarChart's form.
 *  Kept the filename/export so callers don't change; it is no longer a donut. */
export default function DonutChart({ segments, total, onSegmentClick, activeKey }) {
  const max = Math.max(...segments.map((s) => s.value), 1);
  return (
    <div className="hbar-list status-bars">
      <div className="hbar-total">{total} total</div>
      {segments.map((s) => {
        const pct = total ? Math.round((s.value / total) * 100) : 0;
        const w = Math.max(Math.round((s.value / max) * 100), 2);
        const active = activeKey === s.key;
        return (
          <button
            type="button"
            key={s.key}
            className={`hbar-row${active ? ' active' : ''}`}
            onClick={onSegmentClick ? () => onSegmentClick(s.key) : undefined}
            title={`${s.value} invoices (${pct}%): click to filter`}
          >
            <span className="hbar-label">
              <span className="hbar-dot" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="hbar-track">
              <span className="hbar-fill" style={{ width: `${w}%`, background: s.color }} />
            </span>
            <span className="hbar-val">{s.value} <span className="hbar-pct">· {pct}%</span></span>
          </button>
        );
      })}
    </div>
  );
}
