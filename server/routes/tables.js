import { Router } from 'express';
import { query, withConn } from '../db.js';
import { requireAuth } from '../auth.js';

const r = Router();

function parseJson(v) {
  return typeof v === 'string' ? JSON.parse(v) : v;
}

r.get('/tables/:key', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT cells_json FROM table_rows WHERE table_key=? ORDER BY row_index',
      [req.params.key],
    );
    res.json(rows.map((x) => parseJson(x.cells_json)));
  } catch (e) {
    next(e);
  }
});

r.put('/tables/:key', requireAuth, async (req, res, next) => {
  try {
    const key = req.params.key;
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    await withConn(async (c) => {
      await c.execute('DELETE FROM table_rows WHERE table_key=?', [key]);
      for (let i = 0; i < rows.length; i++) {
        await c.execute(
          'INSERT INTO table_rows (table_key,row_index,cells_json) VALUES (?,?,?)',
          [key, i, JSON.stringify(rows[i])],
        );
      }
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

export default r;
