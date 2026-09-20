import { INTERNAL_TEAM_CHANNELS } from '../src/data/constants.js';

/** WHERE fragment limiting invoices to what this caller may see.
 *  - supplier sessions: only their own vendor code
 *  - Internal Team scope (from the session, or ?scope=internalTeam when an HQ
 *    admin is viewing as the team): only the team's channels */
export function invoiceVisibility(req) {
  if (req.session.authType === 'supplier') {
    return { sql: ' WHERE vcode=?', params: [req.session.supplier?.vcode ?? ''] };
  }
  const scoped = req.session.scope?.channelScope === 'internalTeam' || req.query.scope === 'internalTeam';
  if (scoped) {
    return { sql: ` WHERE channel IN (${INTERNAL_TEAM_CHANNELS.map(() => '?').join(',')})`, params: [...INTERNAL_TEAM_CHANNELS] };
  }
  return { sql: '', params: [] };
}
