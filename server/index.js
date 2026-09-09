import { pathToFileURL } from 'node:url';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import bootstrapRoutes from './routes/bootstrap.js';
import invoiceRoutes from './routes/invoices.js';
import ticketRoutes from './routes/tickets.js';
import tableRoutes from './routes/tables.js';
import settingsRoutes from './routes/settings.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', authRoutes);
  app.use('/api', bootstrapRoutes);
  app.use('/api', invoiceRoutes);
  app.use('/api', ticketRoutes);
  app.use('/api', tableRoutes);
  app.use('/api', settingsRoutes);

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  });

  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3001;
  createApp().listen(port, () => console.log(`API listening on http://localhost:${port}`));
}
