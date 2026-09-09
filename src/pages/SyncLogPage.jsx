import { SYNC_LOG } from '../data/invoices';
import Badge from '../components/common/Badge.jsx';

export default function SyncLogPage() {
  const okCount = SYNC_LOG.filter((s) => s.status === 'Success').length;
  const failCount = SYNC_LOG.filter((s) => s.status === 'Failed').length;
  return (
    <>
      <h1 className="page-title">Sync Log</h1>
      <div className="row" style={{ marginBottom: 18 }}>
        <div className="stat-card"><div className="lbl">Total Syncs (24h)</div><div className="val">{SYNC_LOG.length}</div></div>
        <div className="stat-card"><div className="lbl">Successful</div><div className="val">{okCount}</div></div>
        <div className="stat-card bad"><div className="lbl">Failed</div><div className="val">{failCount}</div></div>
      </div>
      <div className="card">
        <h3>Platform / SAP Sync History</h3>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Channel</th><th>Time</th><th>Status</th><th>Records</th><th>Message</th></tr></thead>
            <tbody>
              {SYNC_LOG.map((s, i) => (
                <tr key={i}>
                  <td>{s.channel}</td><td>{s.time}</td>
                  <td><Badge tone={s.status === 'Success' ? 'green' : 'red'}>{s.status}</Badge></td>
                  <td>{s.records}</td><td>{s.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
