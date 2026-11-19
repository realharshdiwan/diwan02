import { Resend } from 'resend';
import {
  SITE,
  validateApplication,
  type ApplicationInput,
} from '../src/lib/site.ts';
import {
  buildApplicantConfirmationPayload,
  buildStudioNotificationPayload,
  resolveResendConfig,
} from '../src/lib/resendEmail.ts';

interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

interface StoredApplication extends ApplicationInput {
  id: string;
  submittedAt: string;
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

function generateReferenceId(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DM-${datePart}-${randomPart}`;
}

function clientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return raw?.split(',')[0]?.trim() || 'unknown';
}

async function dispatchEmail(record: StoredApplication): Promise<boolean> {
  const config = resolveResendConfig(process.env, SITE.contactEmail);
  if (!config.apiKey) {
    console.warn('[resend] RESEND_API_KEY is missing; no email sent.');
    return false;
  }

  try {
    const resend = new Resend(config.apiKey);
    const { data, error } = await resend.emails.send(
      buildStudioNotificationPayload(record, {
        from: config.from,
        to: config.notifyEmail,
      }),
    );

    if (error) {
      console.error('[resend] Studio notification rejected:', error);
      return false;
    }

    console.log(
      `[resend] Studio notification accepted${data?.id ? ` (${data.id})` : ''} for ${config.notifyEmail}.`,
    );

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, message: 'Method not allowed.' });
    return;
  }

  const body = (req.body || {}) as Partial<ApplicationInput> & {
    website?: unknown;
  };

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

  if (isRateLimited(clientIp(req))) {
    res.status(429).json({
      ok: false,
      message:
        'Too many submissions in a short window. Please wait a few minutes.',
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
    const emailDispatched = await dispatchEmail(record);
    res.status(201).json({
      ok: true,
      id: record.id,
      submittedAt: record.submittedAt,
      stored: false,
      emailDispatched,
    });
  } catch (err) {
    console.error('[apply] Unexpected error:', err);
    res.status(500).json({
      ok: false,
      message: `Could not send your application right now. Email ${SITE.contactEmail} directly.`,
    });
  }
}
