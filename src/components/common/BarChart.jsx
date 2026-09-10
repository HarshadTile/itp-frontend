/** Compact horizontal bar list — one row per series. Click a row to filter. */
export default function BarChart({ bars, onBarClick, activeKey }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const total = bars.reduce((s, b) => s + b.value, 0);
  return (
    <div className="hbar-list">
      {bars.map((b) => {
        const pct = max ? Math.round((b.value / max) * 100) : 0;
        const share = total ? Math.round((b.value / total) * 100) : 0;
        const active = activeKey === b.key;
        return (
          <button
            type="button"
            key={b.key}
            className={`hbar-row${active ? ' active' : ''}`}
            onClick={onBarClick ? () => onBarClick(b.key) : undefined}
            title={`${b.value} invoices (${share}% of total)${onBarClick ? ' — click to filter' : ''}`}
          >
            <span className="hbar-label">{b.label}</span>
            <span className="hbar-track">
              <span className="hbar-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
            </span>
            <span className="hbar-val">{b.value}</span>
          </button>
        );
      })}
    </div>
  );
}
