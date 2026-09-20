// Supplier / PAN / vendor-code helpers for the server.
//
// These mirror the pure functions in src/utils/businessLogic.js but import only
// the two leaf data modules (which have no further imports), so this file loads
// cleanly under plain Node ESM — the client's businessLogic.js uses
// extension-less imports that only Vite resolves.
import { VENDOR_CODE_MAP } from '../src/data/constants.js';
import { INVOICE_DATA } from '../src/data/invoices.js';
import { query } from './db.js';

function hashIdx(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

function synthPAN(name) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < 5; i++) s += letters[hashIdx(name + 'L' + i, 26)];
  for (let i = 0; i < 4; i++) s += hashIdx(name + 'D' + i, 10).toString();
  s += letters[hashIdx(name + 'X', 26)];
  return s;
}

const PAN_MASTER = {};
export function panFor(supplier) {
  if (!PAN_MASTER[supplier]) PAN_MASTER[supplier] = synthPAN(supplier);
  return PAN_MASTER[supplier];
}

/** Resolve a vendor code (case-insensitive) to { vcode, vendor } from the
 *  invoice table or the vendor-code master. Returns null for unknown codes. */
export async function supplierForCode(code) {
  const wanted = String(code).trim().toUpperCase();
  const rows = await query('SELECT vcode, vendor FROM invoices WHERE UPPER(vcode)=? LIMIT 1', [wanted]);
  if (rows.length) return { vcode: rows[0].vcode, vendor: rows[0].vendor };
  const hit = VENDOR_CODE_MAP.rows.find((r) => r[0].toUpperCase() === wanted);
  return hit ? { vcode: hit[0], vendor: hit[1] } : null;
}

export function vendorCodesFor(supplier) {
  const fromMap = VENDOR_CODE_MAP.rows.filter((r) => r[1] === supplier).map((r) => r[0]);
  if (fromMap.length) return fromMap;
  return [...new Set(INVOICE_DATA.filter((i) => i.vendor === supplier).map((i) => i.vcode))];
}
