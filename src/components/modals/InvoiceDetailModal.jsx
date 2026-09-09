import { useDispatch } from 'react-redux';
import { INVOICE_DATA } from '../../data/invoices';
import { CHANNEL_STAGES, CHANNEL_LABEL, CHANNEL_ROUTING_RULE, STATUS_CHIP } from '../../data/constants';
import { stageProgress, handlerFor } from '../../utils/businessLogic';
import { closeModal, openModal } from '../../features/ui/uiSlice';
import ModalShell from './ModalShell.jsx';
import Badge from '../common/Badge.jsx';

export default function InvoiceDetailModal({ ctx }) {
  const dispatch = useDispatch();
  const inv = INVOICE_DATA.find((i) => i.no === ctx.no);
  if (!inv) return null;
  const stages = CHANNEL_STAGES[inv.channel];
  const done = stageProgress(inv.channel, inv.status);
  const failed = inv.status === 'Failed';
  const h = handlerFor(inv);
  const bookedOrLater = done >= Math.ceil(stages.length * 0.7) || inv.status === 'Paid' || inv.status === 'Short-Paid';

  return (
    <ModalShell
      title={inv.no}
      width={600}
      foot={(
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => dispatch(openModal({ kind: 'notifyPreview', ctx: { no: inv.no } }))}>✉ Notify Supplier</button>
          </div>
          <button type="button" className="btn" onClick={() => dispatch(closeModal())}>Close</button>
        </div>
      )}
    >
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="form-field" style={{ flex: 1 }}><label>Vendor</label><input value={inv.vendor} readOnly /></div>
        <div className="form-field" style={{ flex: 1 }}><label>Vendor Code</label><input value={inv.vcode} readOnly /></div>
      </div>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="form-field" style={{ flex: 1 }}><label>Channel</label><input value={CHANNEL_LABEL[inv.channel]} readOnly /></div>
        <div className="form-field" style={{ flex: 1 }}><label>PO No</label><input value={inv.po} readOnly /></div>
        <div className="form-field" style={{ flex: 1 }}><label>Amount</label><input value={inv.amount} readOnly /></div>
      </div>
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', margin: '-10px 0 16px' }}>Why this channel: {CHANNEL_ROUTING_RULE[inv.channel]}</p>

      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Currently Handled By</label>
      <div className="row" style={{ margin: '8px 0 16px' }}>
        <div className="form-field" style={{ flex: 1 }}><label>Approver</label><input value={`${h.approver} · ${h.approverEmail}`} readOnly /></div>
        <div className="form-field" style={{ flex: 1 }}><label>Accounts</label><input value={bookedOrLater ? `${h.accounts} · ${h.accountsEmail}` : 'Not yet assigned'} readOnly /></div>
      </div>

      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Stage-by-Stage Status ({CHANNEL_LABEL[inv.channel]})</label>
      <div style={{ margin: '10px 0 18px' }}>
        {stages.map((s, i) => {
          const idx = i + 1;
          const st = failed && idx >= done ? 'fail' : idx < done ? 'done' : idx === done ? 'current' : 'todo';
          const dotBg = st === 'fail' ? 'var(--red)' : st === 'done' ? 'var(--green)' : st === 'current' ? 'var(--blue)' : '#E2E8F0';
          const dotFg = st === 'todo' ? 'var(--text-muted)' : '#fff';
          const txtColor = st === 'todo' ? 'var(--text-muted)' : 'var(--text)';
          return (
            <div style={{ display: 'flex', gap: 10 }} key={i}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: dotBg, color: dotFg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {st === 'done' ? '✓' : st === 'fail' ? '✕' : idx}
                </div>
                {i < stages.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 14, background: idx < done ? 'var(--blue)' : '#E2E8F0' }} />}
              </div>
              <div style={{ paddingBottom: 14, paddingTop: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: st === 'current' ? 700 : 500, color: txtColor }}>{s}</div>
                {st === 'current' && <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 2 }}>In progress</div>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="validation-row"><span>Current Status</span><Badge tone={STATUS_CHIP[inv.status] || 'gray'}>{inv.status}</Badge></div>
      <div className="validation-row"><span>UTR No.</span><span>{inv.utr === '-' ? <span style={{ color: '#CBD5E1' }}>Not yet visible</span> : inv.utr}</span></div>
      {inv.shortPayReason && <div className="validation-row"><span>Short-Payment Reason</span><span style={{ textAlign: 'right', maxWidth: 280 }}>{inv.shortPayReason}</span></div>}
      <div className="validation-row"><span>Invoice Date</span><span>{inv.date}</span></div>
    </ModalShell>
  );
}
