import { CHANNELS } from '../src/data/constants.js';

/** WHERE fragment limiting invoices to what this caller may see.
 *  - supplier sessions: only their own vendor code
 *  - Channel scope (from the session, or ?scope=msetuSrm when an HQ
 *    admin is viewing as a specific channel): only that channel */
export function invoiceVisibility(req) {
  if (req.session.authType === 'supplier') {
    return { sql: ' WHERE vcode=?', params: [req.session.supplier?.vcode ?? ''] };
  }
  
  const validScopes = ['msetuSrm', 'poPortal', 'mfoxPortal'];
  const sessionScope = req.session.scope?.channelScope;
  const queryScope = req.query.scope;
  
  const targetScope = validScopes.includes(sessionScope) ? sessionScope : 
                      (validScopes.includes(queryScope) ? queryScope : 'all');

  if (targetScope !== 'all') {
    return { sql: ' WHERE channel=?', params: [targetScope] };
  }
  return { sql: '', params: [] };
}
