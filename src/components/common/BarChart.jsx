export default function BarChart({ bars, onBarClick, activeKey }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="barchart">
      {bars.map((b) => {
        const h = max ? Math.round((b.value / max) * 92) + 6 : 6;
        const active = activeKey === b.key;
        return (
          <button
            type="button"
            key={b.key}
            className="bar-wrap"
            onClick={onBarClick ? () => onBarClick(b.key) : undefined}
            title={`${b.value} invoices${b.pct != null ? ` (${b.pct}%)` : ''}${onBarClick ? ': click to filter' : ''}`}
          >
            <div className="bar-val">{b.value}</div>
            <div className={`bar${active ? ' active' : ''}`} style={{ height: h }} />
            <div className="bar-lbl" style={active ? { color: 'var(--brand)', fontWeight: 700 } : undefined}>{b.label}</div>
          </button>
        );
      })}
    </div>
  );
}
