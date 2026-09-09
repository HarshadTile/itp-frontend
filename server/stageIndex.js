import { CHANNEL_STAGES } from '../src/data/constants.js';

// Best-effort mapping from the coarse status vocabulary to a position within
// the channel's stage list. Used only at seed time to give each invoice a
// sensible starting stage_index; the UI moves it from there.
const STATUS_TO_FRACTION = {
  Uploaded: 0.1,
  'Pending Approval': 0.4,
  Approved: 0.55,
  Booked: 0.75,
  'Payment Due': 0.85,
  Paid: 1,
  'Short-Paid': 1,
  Failed: 0.5,
};

export function stageIndexFor(inv) {
  const stages = CHANNEL_STAGES[inv.channel] || [];
  if (stages.length === 0) return 0;
  const frac = STATUS_TO_FRACTION[inv.status] ?? 0.1;
  return Math.max(0, Math.min(stages.length - 1, Math.round(frac * (stages.length - 1))));
}
