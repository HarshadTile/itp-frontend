// Supplier / PAN / vendor-code helpers for the server.
//
// These mirror the pure functions in src/utils/businessLogic.js but import only
// the two leaf data modules (which have no further imports), so this file loads
// cleanly under plain Node ESM — the client's businessLogic.js uses
// extension-less imports that only Vite resolves.
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
  if (rows.length) return { vcode: rows[0].vcode, vendor: rows[0].vendor, pan: null };

  // Supplier identity is owned by the FastAPI invoice service when the local
  // Express workspace database has no imported invoice rows.
  try {
    const baseUrl = process.env.INVOICE_API_URL || 'http://127.0.0.1:8000/api/v1';
    const url = new URL(`${baseUrl}/invoices`);
    url.searchParams.set('vendor_code', wanted);
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', '1');
    const response = await fetch(url);
    if (!response.ok) return null;
    const payload = await response.json();
    const invoice = payload.items?.[0];
    if (!invoice?.supplier?.vendor_code) return null;
    return {
      vcode: invoice.supplier.vendor_code,
      vendor: invoice.supplier.supplier_name,
      pan: invoice.supplier.pan,
    };
  } catch {
    return null;
  }
}

