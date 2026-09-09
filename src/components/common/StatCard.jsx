export default function StatCard({ label, value, sub, tone, icon, onClick, active }) {
  const cls = ['stat-card', tone, onClick ? 'clickable' : ''].filter(Boolean).join(' ');
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      className={cls}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      style={onClick ? { textAlign: 'left', border: active ? '1px solid var(--brand)' : undefined } : undefined}
    >
      {icon && <div className="icon-badge">{icon}</div>}
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </Comp>
  );
}
