import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import {
  SITE,
  validateApplication,
  type ApplicationInput,
} from './src/lib/site.ts';
import {
  buildApplicantConfirmationPayload,
  buildStudioNotificationPayload,
  resolveResendConfig,
  type StoredApplicationRecord,
} from './src/lib/resendEmail.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(__dirname, 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

type StoredApplication = StoredApplicationRecord;

/** Serialize file writes so simultaneous form submissions cannot clobber each other. */
let writeChain: Promise<void> = Promise.resolve();

function saveApplication(record: StoredApplication): Promise<void> {
  const next = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    let existing: StoredApplication[] = [];
    try {
      const raw = await fs.readFile(APPLICATIONS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existing = parsed as StoredApplication[];
      }
    } catch {
      // File does not exist yet on first submission.
    }
    await fs.writeFile(
      APPLICATIONS_FILE,
      JSON.stringify([record, ...existing], null, 2),
      'utf8',
    );
  });
  writeChain = next.catch(() => {});
  return next;
}

async function readApplications(): Promise<StoredApplication[]> {
  try {
    const raw = await fs.readFile(APPLICATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredApplication[]) : [];
  } catch {
    return [];
  }
}

const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX_REQUESTS = 8;
const ipSubmissionLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (ipSubmissionLog.get(ip) || []).filter(
    (ts) => now - ts < RATE_WINDOW_MS,
  );
  if (recent.length >= RATE_MAX_REQUESTS) {
    ipSubmissionLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipSubmissionLog.set(ip, recent);
  return false;
}

async function dispatchResendEmail(record: StoredApplication): Promise<boolean> {
  const config = resolveResendConfig(process.env, SITE.contactEmail);
  if (!config.apiKey) {
    console.warn(
      '[resend] RESEND_API_KEY is not set. The application was recorded, but no email was sent.',
    );
    return false;
  }

  const resend = new Resend(config.apiKey);

  try {
    const { error } = await resend.emails.send(
      buildStudioNotificationPayload(record, {
        from: config.from,
        to: config.notifyEmail,
      }),
    );

    if (error) {
      console.error('[resend] Studio notification rejected:', error);
      return false;
    }

    // Applicant confirmation requires a verified custom sender domain in Resend.
    if (config.customDomain) {
      const confirmation = await resend.emails.send(
        buildApplicantConfirmationPayload(record, {
          from: config.from,
          replyTo: config.notifyEmail,
        }),
      );
      if (confirmation.error) {
        console.warn(
          '[resend] Applicant confirmation skipped:',
          confirmation.error,
        );
      }
    }

    return true;
  } catch (err) {
    console.error('[resend] Unexpected delivery error:', err);
    return false;
  }
}

async function dispatchWebhook(record: StoredApplication): Promise<boolean> {
  const webhookUrl = process.env.APPLICATION_WEBHOOK_URL;
  if (!webhookUrl) {
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function generateReferenceId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DM-${datePart}-${randomPart}`;
}

function formatCsvCell(value: string): string {
  const safe = value.replaceAll('"', '""');
  return `"${safe}"`;
}

function toCsv(records: StoredApplication[]): string {
  const headers = ['id', 'submittedAt', 'role', 'name', 'email', 'portfolioUrl', 'note'];
  const rows = records.map((r) =>
    [r.id, r.submittedAt, r.role, r.name, r.email, r.portfolioUrl, r.note]
      .map(formatCsvCell)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function isAuthorizedAdmin(req: express.Request, adminKey: string): boolean {
  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const queryKey = typeof req.query.key === 'string' ? req.query.key.trim() : '';
  const provided = bearer || queryKey;
  if (!provided || provided.length !== adminKey.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(adminKey));
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '64kb' }));

  const startupResend = resolveResendConfig(process.env, SITE.contactEmail);
  if (!startupResend.apiKey) {
    console.warn(
      '[resend] RESEND_API_KEY is missing. Applications will be recorded, but no email will be sent until it is set in .env.',
    );
  } else {
    console.log(
      `[resend] Sending from "${startupResend.from}" to "${startupResend.notifyEmail}".`,
    );
  }

  app.get('/api/health', (_req, res) => {
    const resendConfig = resolveResendConfig(process.env, SITE.contactEmail);
    res.json({
      ok: true,
      emailConfigured: Boolean(resendConfig.apiKey),
      resendFrom: resendConfig.from,
      notifyEmail: resendConfig.notifyEmail,
      customResendDomain: resendConfig.customDomain,
      webhookConfigured: Boolean(process.env.APPLICATION_WEBHOOK_URL),
    });
  });

  app.get('/api/applications', async (req, res) => {
    const adminKey = process.env.APPLICATION_ADMIN_KEY;
    if (!adminKey) {
      res.status(404).json({ ok: false, message: 'Not enabled.' });
      return;
    }
    if (!isAuthorizedAdmin(req, adminKey)) {
      res.status(401).json({ ok: false, message: 'Unauthorized.' });
      return;
    }
    const records = await readApplications();
    if (req.query.format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="diwan-mercantile-applications.csv"',
      );
      res.send(toCsv(records));
      return;
    }
    res.json({ ok: true, count: records.length, applications: records });
  });

  app.post('/api/apply', async (req, res) => {
    const body = (req.body || {}) as Partial<ApplicationInput> & {
      website?: unknown;
    };

    // Silently accept bot honeypot fills without writing or notifying.
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      res.status(201).json({
        ok: true,
        id: generateReferenceId(),
        submittedAt: new Date().toISOString(),
        stored: false,
        emailDispatched: false,
      });
      return;
    }

    const clientIp = req.ip || 'unknown';
    if (isRateLimited(clientIp)) {
      res.status(429).json({
        ok: false,
        message: 'Too many submissions in a short window. Please wait a few minutes.',
      });
      return;
    }

    const input: ApplicationInput = {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      email: typeof body.email === 'string' ? body.email.trim() : '',
      role: typeof body.role === 'string' ? body.role.trim() : '',
      portfolioUrl:
        typeof body.portfolioUrl === 'string' ? body.portfolioUrl.trim() : '',
      note: typeof body.note === 'string' ? body.note.trim() : '',
    };

    const validation = validateApplication(input);
    if (!validation.valid) {
      res.status(400).json({
        ok: false,
        message: 'Check the highlighted fields.',
        errors: validation.errors,
      });
      return;
    }

    const record: StoredApplication = {
      ...input,
      id: generateReferenceId(),
      submittedAt: new Date().toISOString(),
    };

    try {
      // Email and webhook delivery must not depend on the local filesystem.
      // Send first, then persist as a best-effort record.
      const [emailDispatched, webhookDispatched] = await Promise.all([
        dispatchResendEmail(record),
        dispatchWebhook(record),
      ]);

      let stored = true;
      try {
        await saveApplication(record);
      } catch (storageError) {
        stored = false;
        console.error(
          '[applications] Could not store the application:',
          storageError,
        );
      }

      if (!stored && !emailDispatched && !webhookDispatched) {
        res.status(500).json({
          ok: false,
          message:
            'Could not record your application right now. Email diwanmercantileindia@gmail.com directly.',
        });
        return;
      }

      res.status(201).json({
        ok: true,
        id: record.id,
        submittedAt: record.submittedAt,
        stored,
        emailDispatched,
        webhookDispatched,
      });
    } catch {
      res.status(500).json({
        ok: false,
        message:
          'Could not record your application right now. Email diwanmercantileindia@gmail.com directly.',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
