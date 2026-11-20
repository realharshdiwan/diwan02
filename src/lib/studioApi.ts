import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { estimateReadingMinutes, slugifyTitle } from './markdown.ts';
import {
  buildApplicantConfirmationPayload,
  buildCandidateReplyPayload,
  buildStudioNotificationPayload,
  resolveResendConfig,
} from './resendEmail.ts';
import {
  APPLICATION_STATUSES,
  DEFAULT_COHORTS,
  DEFAULT_VENTURES,
  RESEARCH_POSTS,
  SITE,
  STUDIO_ITEM_STATUSES,
  STUDIO_ITEM_STREAMS,
  VENTURE_STATUSES,
  validateApplication,
  type ApplicationInput,
  type ApplicationRecord,
  type ApplicationStatus,
  type CohortRecord,
  type ResearchKind,
  type ResearchPost,
  type StudioItem,
  type StudioItemStatus,
  type StudioStream,
  type VentureRecord,
  type VentureStatus,
} from './site.ts';

export interface UnifiedRequest {
  method: string;
  pathname: string;
  query: Record<string, string | undefined>;
  headers: Record<string, string | undefined>;
  body: unknown;
  ip: string;
}

export interface UnifiedResponse {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
  rawText?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

let localWriteChain: Promise<void> = Promise.resolve();

async function saveLocalApplication(record: ApplicationRecord): Promise<boolean> {
  let saved = false;
  const next = localWriteChain.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      let existing: ApplicationRecord[] = [];
      try {
        const raw = await fs.readFile(APPLICATIONS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          existing = parsed as ApplicationRecord[];
        }
      } catch {
        // First submission on disk.
      }
      await fs.writeFile(
        APPLICATIONS_FILE,
        JSON.stringify([record, ...existing], null, 2),
        'utf8',
      );
      saved = true;
    } catch {
      saved = false;
    }
  });
  localWriteChain = next.catch(() => {});
  await next;
  return saved;
}

async function readLocalApplications(): Promise<ApplicationRecord[]> {
  try {
    const raw = await fs.readFile(APPLICATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Partial<ApplicationRecord>[]).map((item) => ({
      id: item.id || '',
      submittedAt: item.submittedAt || '',
      name: item.name || '',
      email: item.email || '',
      role: item.role || '',
      portfolioUrl: item.portfolioUrl || '',
      note: item.note || '',
      cohortSlug: item.cohortSlug || 'cohort-2026-27',
      status: item.status || 'new',
      reviewerNotes: item.reviewerNotes || '',
      emailDispatched: Boolean(item.emailDispatched),
    }));
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

function getSupabaseEnv() {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();
  const anonKey = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { url, anonKey, serviceRoleKey };
}

function getServiceSupabase(): SupabaseClient | null {
  const { url, serviceRoleKey } = getSupabaseEnv();
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAuthSupabase(): SupabaseClient | null {
  const { url, anonKey, serviceRoleKey } = getSupabaseEnv();
  const key = anonKey || serviceRoleKey;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAllowedEmails(): string[] {
  const raw =
    process.env.STUDIO_ALLOWED_EMAILS ||
    'diwanharsh33@gmail.com,diwanmercantileindia@gmail.com';
  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyStudioUser(
  headers: Record<string, string | undefined>,
): Promise<
  | { ok: true; email: string }
  | { ok: false; status: number; message: string }
> {
  const authSupabase = getAuthSupabase();
  if (!authSupabase) {
    return {
      ok: false,
      status: 503,
      message: 'Supabase authentication is not configured yet.',
    };
  }

  const authHeader = headers.authorization || headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!token) {
    return { ok: false, status: 401, message: 'Sign in required.' };
  }

  const { data, error } = await authSupabase.auth.getUser(token);
  if (error || !data.user?.email) {
    return {
      ok: false,
      status: 401,
      message: 'Session expired. Request a fresh sign-in link.',
    };
  }

  const email = data.user.email.toLowerCase();
  const allowed = getAllowedEmails();
  if (!allowed.includes(email)) {
    return {
      ok: false,
      status: 403,
      message: `${email} is not on the Studio Ledger access list.`,
    };
  }

  return { ok: true, email };
}

function mapDbPost(row: Record<string, unknown>): ResearchPost {
  return {
    id: String(row.id || ''),
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    dek: String(row.dek || ''),
    bodyMd: String(row.body_md || ''),
    kind: (['note', 'essay', 'link'].includes(String(row.kind))
      ? String(row.kind)
      : 'note') as ResearchKind,
    basis: String(row.basis || 'Desk synthesis'),
    tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
    sourceUrl: String(row.source_url || ''),
    sourceLabel: String(row.source_label || ''),
    status: row.status === 'published' ? 'published' : 'draft',
    readingMinutes: Number(row.reading_minutes) || 1,
    publishedAt: String(row.published_at || row.created_at || ''),
  };
}

function mapDbCohort(row: Record<string, unknown>): CohortRecord {
  return {
    id: String(row.id || ''),
    slug: String(row.slug || ''),
    title: String(row.title || ''),
    windowLabel: String(row.window_label || ''),
    summary: String(row.summary || ''),
    terms: Array.isArray(row.terms) ? row.terms : [],
    roles: Array.isArray(row.roles) ? row.roles : [],
    status: (['open', 'upcoming', 'closed'].includes(String(row.status))
      ? String(row.status)
      : 'open') as CohortRecord['status'],
  };
}

function mapDbApplication(row: Record<string, unknown>): ApplicationRecord {
  return {
    id: String(row.id || row.reference_code || ''),
    cohortSlug: String(row.cohort_slug || 'cohort-2026-27'),
    role: String(row.role_title || ''),
    name: String(row.name || ''),
    email: String(row.email || ''),
    portfolioUrl: String(row.portfolio_url || ''),
    note: String(row.note || ''),
    status: (APPLICATION_STATUSES.some((s) => s.value === row.status)
      ? String(row.status)
      : 'new') as ApplicationStatus,
    reviewerNotes: String(row.reviewer_notes || ''),
    emailDispatched: Boolean(row.email_dispatched),
    submittedAt: String(row.created_at || ''),
  };
}

function mapDbStudioItem(row: Record<string, unknown>): StudioItem {
  return {
    id: String(row.id || ''),
    stream: (STUDIO_ITEM_STREAMS.includes(row.stream as StudioStream)
      ? row.stream
      : 'Studio') as StudioStream,
    title: String(row.title || ''),
    status: (STUDIO_ITEM_STATUSES.some((s) => s.value === row.status)
      ? row.status
      : 'queued') as StudioItemStatus,
    assigneeName: String(row.assignee_name || ''),
    assigneeEmail: String(row.assignee_email || ''),
    dueDate: row.due_date ? String(row.due_date) : '',
    notes: String(row.notes || ''),
    updatedAt: String(row.updated_at || row.created_at || ''),
  };
}

function mapDbVenture(row: Record<string, unknown>): VentureRecord {
  return {
    id: String(row.id || ''),
    slug: String(row.slug || ''),
    name: String(row.name || ''),
    stageLabel: String(row.stage_label || 'In build'),
    headline: String(row.headline || ''),
    summary: String(row.summary || ''),
    url: String(row.url || ''),
    ctaLabel: String(row.cta_label || ''),
    imageSrc: String(row.image_src || ''),
    imageAlt: String(row.image_alt || ''),
    highlights: Array.isArray(row.highlights)
      ? row.highlights.map(String)
      : [],
    status: (VENTURE_STATUSES.some((s) => s.value === row.status)
      ? String(row.status)
      : 'building') as VentureStatus,
    featured: Boolean(row.featured),
    sortOrder: Number(row.sort_order) || 10,
    published: row.published !== false,
  };
}

async function dispatchResendEmail(record: ApplicationRecord): Promise<boolean> {
  const config = resolveResendConfig(process.env, SITE.contactEmail);
  if (!config.apiKey) return false;

  const resend = new Resend(config.apiKey);

  try {
    const { error } = await resend.emails.send(
      buildStudioNotificationPayload(record, {
        from: config.from,
        to: config.notifyEmail,
      }),
    );

    if (error) {
      console.error('[resend] Studio notification rejected:', error.message);
      return false;
    }

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
          confirmation.error.message,
        );
      }
    }

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[resend] Unexpected delivery error:', message);
    return false;
  }
}

async function dispatchWebhook(record: ApplicationRecord): Promise<boolean> {
  const webhookUrl = process.env.APPLICATION_WEBHOOK_URL;
  if (!webhookUrl) return false;

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
  return `"${value.replaceAll('"', '""')}"`;
}

function applicationsToCsv(records: ApplicationRecord[]): string {
  const headers = [
    'reference',
    'submittedAt',
    'status',
    'cohort',
    'role',
    'name',
    'email',
    'portfolioUrl',
    'note',
    'reviewerNotes',
  ];
  const rows = records.map((r) =>
    [
      r.id,
      r.submittedAt,
      r.status,
      r.cohortSlug || '',
      r.role,
      r.name,
      r.email,
      r.portfolioUrl,
      r.note,
      r.reviewerNotes,
    ]
      .map(formatCsvCell)
      .join(','),
  );
  return [headers.join(','), ...rows].join('\n');
}

function isAuthorizedAdminKey(
  req: UnifiedRequest,
  adminKey: string,
): boolean {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const queryKey = (req.query.key || '').trim();
  const provided = bearer || queryKey;
  if (!provided || provided.length !== adminKey.length) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(adminKey));
}

export async function handleApiRequest(
  req: UnifiedRequest,
): Promise<UnifiedResponse> {
  const method = req.method.toUpperCase();
  const pathClean = req.pathname.replace(/\/+$/, '') || '/';
  const supabase = getServiceSupabase();
  const supabaseEnv = getSupabaseEnv();

  // ── Health ───────────────────────────────────────────────────────────────
  if (method === 'GET' && pathClean === '/api/health') {
    const resendConfig = resolveResendConfig(process.env, SITE.contactEmail);
    return {
      status: 200,
      body: {
        ok: true,
        supabaseConfigured: Boolean(supabase),
        emailConfigured: Boolean(resendConfig.apiKey),
        customResendDomain: resendConfig.customDomain,
        webhookConfigured: Boolean(process.env.APPLICATION_WEBHOOK_URL),
      },
    };
  }

  // ── Public Research Posts ────────────────────────────────────────────────
  if (method === 'GET' && pathClean === '/api/posts') {
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false, nullsFirst: false });

      if (!error && Array.isArray(data)) {
        return {
          status: 200,
          body: {
            ok: true,
            source: 'supabase',
            posts: data.map(mapDbPost),
          },
        };
      }
    }
    return {
      status: 200,
      body: { ok: true, source: 'seed', posts: RESEARCH_POSTS },
    };
  }

  if (method === 'GET' && pathClean.startsWith('/api/posts/')) {
    const slug = decodeURIComponent(pathClean.slice('/api/posts/'.length));
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle();

      if (!error && data) {
        return {
          status: 200,
          body: { ok: true, source: 'supabase', post: mapDbPost(data) },
        };
      }
    }
    const seed = RESEARCH_POSTS.find((p) => p.slug === slug);
    if (!seed) {
      return { status: 404, body: { ok: false, message: 'Post not found.' } };
    }
    return { status: 200, body: { ok: true, source: 'seed', post: seed } };
  }

  // ── Public Cohorts ───────────────────────────────────────────────────────
  if (method === 'GET' && pathClean === '/api/cohorts') {
    if (supabase) {
      const { data, error } = await supabase
        .from('cohorts')
        .select('*')
        .in('status', ['open', 'upcoming'])
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          status: 200,
          body: {
            ok: true,
            source: 'supabase',
            cohorts: data.map(mapDbCohort),
          },
        };
      }
    }
    return {
      status: 200,
      body: { ok: true, source: 'seed', cohorts: DEFAULT_COHORTS },
    };
  }

  // ── Public Ventures ──────────────────────────────────────────────────────
  if (method === 'GET' && pathClean === '/api/ventures') {
    if (supabase) {
      const { data, error } = await supabase
        .from('ventures')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          status: 200,
          body: {
            ok: true,
            source: 'supabase',
            ventures: data.map(mapDbVenture),
          },
        };
      }
    }
    return {
      status: 200,
      body: { ok: true, source: 'seed', ventures: DEFAULT_VENTURES },
    };
  }

  // ── Headless Applications Export (Key-Gated Legacy Support) ──────────────
  if (method === 'GET' && pathClean === '/api/applications') {
    const adminKey = process.env.APPLICATION_ADMIN_KEY;
    if (!adminKey) {
      return { status: 404, body: { ok: false, message: 'Not enabled.' } };
    }
    if (!isAuthorizedAdminKey(req, adminKey)) {
      return { status: 401, body: { ok: false, message: 'Unauthorized.' } };
    }

    let records: ApplicationRecord[] = [];
    if (supabase) {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (Array.isArray(data)) {
        records = data.map((row) => ({
          ...mapDbApplication(row),
          id: String(row.reference_code || row.id || ''),
        }));
      }
    } else {
      records = await readLocalApplications();
    }

    if (req.query.format === 'csv') {
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="diwan-mercantile-applications.csv"',
        },
        body: null,
        rawText: applicationsToCsv(records),
      };
    }

    return {
      status: 200,
      body: { ok: true, count: records.length, applications: records },
    };
  }

  // ── Public Application Submission ────────────────────────────────────────
  if (method === 'POST' && pathClean === '/api/apply') {
    const body = (req.body || {}) as Partial<ApplicationInput> & {
      website?: unknown;
    };

    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return {
        status: 201,
        body: {
          ok: true,
          id: generateReferenceId(),
          submittedAt: new Date().toISOString(),
          emailDispatched: false,
          stored: false,
        },
      };
    }

    if (isRateLimited(req.ip || 'unknown')) {
      return {
        status: 429,
        body: {
          ok: false,
          message:
            'Too many submissions in a short window. Please wait a few minutes.',
        },
      };
    }

    const input: ApplicationInput = {
      name: typeof body.name === 'string' ? body.name.trim() : '',
      email: typeof body.email === 'string' ? body.email.trim() : '',
      role: typeof body.role === 'string' ? body.role.trim() : '',
      portfolioUrl:
        typeof body.portfolioUrl === 'string' ? body.portfolioUrl.trim() : '',
      note: typeof body.note === 'string' ? body.note.trim() : '',
      cohortSlug:
        typeof body.cohortSlug === 'string' && body.cohortSlug.trim()
          ? body.cohortSlug.trim()
          : 'cohort-2026-27',
    };

    const validation = validateApplication(input);
    if (!validation.valid) {
      return {
        status: 400,
        body: {
          ok: false,
          message: 'Check the highlighted fields.',
          errors: validation.errors,
        },
      };
    }

    const referenceCode = generateReferenceId();
    const submittedAt = new Date().toISOString();
    const record: ApplicationRecord = {
      ...input,
      id: referenceCode,
      submittedAt,
      status: 'new',
      reviewerNotes: '',
      emailDispatched: false,
    };

    let stored = false;
    let dbRowId: string | null = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          reference_code: referenceCode,
          cohort_slug: input.cohortSlug,
          role_title: input.role,
          name: input.name,
          email: input.email,
          portfolio_url: input.portfolioUrl,
          note: input.note,
          status: 'new',
        })
        .select('id')
        .single();

      if (error) {
        console.error('[supabase] Application insert failed:', error.message);
      } else if (data?.id) {
        stored = true;
        dbRowId = String(data.id);
      }
    }

    if (!stored) {
      stored = await saveLocalApplication(record);
    }

    const [emailDispatched] = await Promise.all([
      dispatchResendEmail(record),
      dispatchWebhook(record),
    ]);

    if (supabase && dbRowId && emailDispatched) {
      await supabase
        .from('applications')
        .update({ email_dispatched: true })
        .eq('id', dbRowId);
    }

    if (!stored && !emailDispatched) {
      return {
        status: 500,
        body: {
          ok: false,
          message:
            'Could not record your application right now. Email diwanmercantileindia@gmail.com directly.',
        },
      };
    }

    return {
      status: 201,
      body: {
        ok: true,
        id: referenceCode,
        submittedAt,
        emailDispatched,
        stored,
      },
    };
  }

  // ── Public Studio Config (Safe Public Keys Only) ─────────────────────────
  if (method === 'GET' && pathClean === '/api/studio/config') {
    const resendConfig = resolveResendConfig(process.env, SITE.contactEmail);
    return {
      status: 200,
      body: {
        ok: true,
        supabaseConfigured: Boolean(supabaseEnv.url && supabaseEnv.anonKey),
        serviceConfigured: Boolean(supabase),
        supabaseUrl: supabaseEnv.url,
        supabaseAnonKey: supabaseEnv.anonKey,
        emailConfigured: Boolean(resendConfig.apiKey),
        customResendDomain: resendConfig.customDomain,
      },
    };
  }

  // ── Private Studio Endpoints (Auth + Allowlist Protected) ────────────────
  if (pathClean.startsWith('/api/studio')) {
    const auth = await verifyStudioUser(req.headers);
    if (!auth.ok) {
      return {
        status: auth.status,
        body: { ok: false, message: auth.message },
      };
    }

    if (!supabase) {
      return {
        status: 503,
        body: {
          ok: false,
          message:
            'SUPABASE_SERVICE_ROLE_KEY is required on the server for Studio Ledger operations.',
        },
      };
    }

    // Overview bundle
    if (method === 'GET' && pathClean === '/api/studio/overview') {
      const [postsRes, cohortsRes, appsRes, deskRes, venturesRes] =
        await Promise.all([
          supabase
            .from('posts')
            .select('*')
            .order('updated_at', { ascending: false }),
          supabase
            .from('cohorts')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('applications')
            .select('*')
            .order('created_at', { ascending: false }),
          supabase
            .from('studio_items')
            .select('*')
            .order('updated_at', { ascending: false }),
          supabase
            .from('ventures')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true }),
        ]);

      const firstError =
        postsRes.error || cohortsRes.error || appsRes.error || deskRes.error;
      if (firstError) {
        return {
          status: 500,
          body: { ok: false, message: firstError.message },
        };
      }

      const venturesList =
        !venturesRes.error && Array.isArray(venturesRes.data)
          ? venturesRes.data.map(mapDbVenture)
          : [...DEFAULT_VENTURES];

      return {
        status: 200,
        body: {
          ok: true,
          user: { email: auth.email },
          posts: (postsRes.data || []).map(mapDbPost),
          cohorts: (cohortsRes.data || []).map(mapDbCohort),
          applications: (appsRes.data || []).map((row) => ({
            ...mapDbApplication(row),
            dbId: String(row.id),
            id: String(row.reference_code || row.id),
          })),
          studioItems: (deskRes.data || []).map(mapDbStudioItem),
          ventures: venturesList,
        },
      };
    }

    // Export Candidates CSV
    if (method === 'GET' && pathClean === '/api/studio/applications.csv') {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        return { status: 500, body: { ok: false, message: error.message } };
      }
      const mapped = (data || []).map((row) => ({
        ...mapDbApplication(row),
        id: String(row.reference_code || row.id),
      }));
      return {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition':
            'attachment; filename="diwan-mercantile-candidates.csv"',
        },
        body: null,
        rawText: applicationsToCsv(mapped),
      };
    }

    // Create / Update / Delete Posts
    if (method === 'POST' && pathClean === '/api/studio/posts') {
      const b = (req.body || {}) as Partial<ResearchPost>;
      const title = String(b.title || '').trim();
      const bodyMd = String(b.bodyMd || '').trim();
      if (!title) {
        return { status: 400, body: { ok: false, message: 'Title is required.' } };
      }
      const slug = slugifyTitle(String(b.slug || title)) || `note-${Date.now()}`;
      const status = b.status === 'published' ? 'published' : 'draft';
      const payload = {
        slug,
        title,
        dek: String(b.dek || '').trim(),
        body_md: bodyMd,
        kind: (['note', 'essay', 'link'].includes(String(b.kind))
          ? b.kind
          : 'note') as ResearchKind,
        basis: String(b.basis || 'Desk synthesis').trim(),
        tags: Array.isArray(b.tags)
          ? b.tags.map((t) => String(t).trim()).filter(Boolean)
          : [],
        source_url: String(b.sourceUrl || '').trim(),
        source_label: String(b.sourceLabel || '').trim(),
        status,
        reading_minutes: estimateReadingMinutes(bodyMd || title),
        published_at:
          status === 'published'
            ? b.publishedAt || new Date().toISOString()
            : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('posts')
        .insert(payload)
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 201, body: { ok: true, post: mapDbPost(data) } };
    }

    if (method === 'PATCH' && pathClean.startsWith('/api/studio/posts/')) {
      const id = pathClean.slice('/api/studio/posts/'.length);
      const b = (req.body || {}) as Partial<ResearchPost>;
      const title = String(b.title || '').trim();
      const bodyMd = String(b.bodyMd || '').trim();
      if (!title) {
        return { status: 400, body: { ok: false, message: 'Title is required.' } };
      }
      const status = b.status === 'published' ? 'published' : 'draft';
      const slug = slugifyTitle(String(b.slug || title)) || `note-${Date.now()}`;
      const { data, error } = await supabase
        .from('posts')
        .update({
          slug,
          title,
          dek: String(b.dek || '').trim(),
          body_md: bodyMd,
          kind: (['note', 'essay', 'link'].includes(String(b.kind))
            ? b.kind
            : 'note') as ResearchKind,
          basis: String(b.basis || 'Desk synthesis').trim(),
          tags: Array.isArray(b.tags)
            ? b.tags.map((t) => String(t).trim()).filter(Boolean)
            : [],
          source_url: String(b.sourceUrl || '').trim(),
          source_label: String(b.sourceLabel || '').trim(),
          status,
          reading_minutes: estimateReadingMinutes(bodyMd || title),
          published_at:
            status === 'published'
              ? b.publishedAt || new Date().toISOString()
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true, post: mapDbPost(data) } };
    }

    if (method === 'DELETE' && pathClean.startsWith('/api/studio/posts/')) {
      const id = pathClean.slice('/api/studio/posts/'.length);
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true } };
    }

    // Create / Update Cohorts
    if (method === 'POST' && pathClean === '/api/studio/cohorts') {
      const b = (req.body || {}) as Partial<CohortRecord>;
      const title = String(b.title || '').trim();
      if (!title) {
        return {
          status: 400,
          body: { ok: false, message: 'Cohort title is required.' },
        };
      }
      const slug = slugifyTitle(String(b.slug || title)) || `cohort-${Date.now()}`;
      const { data, error } = await supabase
        .from('cohorts')
        .insert({
          slug,
          title,
          window_label: String(b.windowLabel || '').trim(),
          summary: String(b.summary || '').trim(),
          terms: Array.isArray(b.terms) ? b.terms : [],
          roles: Array.isArray(b.roles) ? b.roles : [],
          status: (['open', 'upcoming', 'closed'].includes(String(b.status))
            ? b.status
            : 'open') as CohortRecord['status'],
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 201, body: { ok: true, cohort: mapDbCohort(data) } };
    }

    if (method === 'PATCH' && pathClean.startsWith('/api/studio/cohorts/')) {
      const id = pathClean.slice('/api/studio/cohorts/'.length);
      const b = (req.body || {}) as Partial<CohortRecord>;
      const title = String(b.title || '').trim();
      if (!title) {
        return {
          status: 400,
          body: { ok: false, message: 'Cohort title is required.' },
        };
      }
      const { data, error } = await supabase
        .from('cohorts')
        .update({
          slug: slugifyTitle(String(b.slug || title)) || `cohort-${Date.now()}`,
          title,
          window_label: String(b.windowLabel || '').trim(),
          summary: String(b.summary || '').trim(),
          terms: Array.isArray(b.terms) ? b.terms : [],
          roles: Array.isArray(b.roles) ? b.roles : [],
          status: (['open', 'upcoming', 'closed'].includes(String(b.status))
            ? b.status
            : 'open') as CohortRecord['status'],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true, cohort: mapDbCohort(data) } };
    }

    // Candidate Application Review Update
    if (
      method === 'PATCH' &&
      pathClean.startsWith('/api/studio/applications/')
    ) {
      const referenceCode = decodeURIComponent(
        pathClean.slice('/api/studio/applications/'.length),
      );
      const b = (req.body || {}) as {
        status?: ApplicationStatus;
        reviewerNotes?: string;
      };
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (
        b.status &&
        APPLICATION_STATUSES.some((item) => item.value === b.status)
      ) {
        updates.status = b.status;
      }
      if (typeof b.reviewerNotes === 'string') {
        updates.reviewer_notes = b.reviewerNotes;
      }

      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('reference_code', referenceCode)
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return {
        status: 200,
        body: {
          ok: true,
          application: {
            ...mapDbApplication(data),
            id: String(data.reference_code || data.id),
          },
        },
      };
    }

    // Authenticated Candidate Reply Dispatch via Resend
    if (
      method === 'POST' &&
      pathClean === '/api/studio/applications/reply'
    ) {
      const b = (req.body || {}) as {
        referenceId?: string;
        to?: string;
        subject?: string;
        body?: string;
        nextStatus?: ApplicationStatus;
      };
      const to = String(b.to || '').trim();
      const subject = String(b.subject || '').trim();
      const body = String(b.body || '').trim();
      const referenceId = String(b.referenceId || '').trim();

      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return {
          status: 400,
          body: { ok: false, message: 'Valid candidate email is required.' },
        };
      }
      if (!subject || subject.length > 200) {
        return {
          status: 400,
          body: {
            ok: false,
            message: 'Email subject is required (max 200 characters).',
          },
        };
      }
      if (!body || body.length > 8000) {
        return {
          status: 400,
          body: {
            ok: false,
            message: 'Reply message is required (max 8,000 characters).',
          },
        };
      }

      const resendConfig = resolveResendConfig(process.env, SITE.contactEmail);
      if (!resendConfig.apiKey) {
        return {
          status: 503,
          body: {
            ok: false,
            message:
              'RESEND_API_KEY is not configured. Use Open in Mail or Copy draft instead.',
          },
        };
      }

      if (!resendConfig.customDomain) {
        return {
          status: 422,
          body: {
            ok: false,
            message:
              'Resend is running in sandbox mode without a verified custom domain (RESEND_FROM_EMAIL). Use Open in Mail or Copy draft to send to external applicants.',
          },
        };
      }

      const resend = new Resend(resendConfig.apiKey);
      const { error: sendError } = await resend.emails.send(
        buildCandidateReplyPayload({
          to,
          referenceId,
          subject,
          body,
          from: resendConfig.from,
          replyTo: resendConfig.notifyEmail,
        }),
      );

      if (sendError) {
        return {
          status: 502,
          body: {
            ok: false,
            message: `Resend rejected delivery (${sendError.message}). Use Open in Mail or Copy draft instead.`,
          },
        };
      }

      let updatedApp: ApplicationRecord | null = null;
      if (referenceId) {
        const nextStatus =
          b.nextStatus &&
          APPLICATION_STATUSES.some((item) => item.value === b.nextStatus)
            ? b.nextStatus
            : undefined;
        const updates: Record<string, unknown> = {
          email_dispatched: true,
          updated_at: new Date().toISOString(),
        };
        if (nextStatus) {
          updates.status = nextStatus;
        }
        const { data: appRow } = await supabase
          .from('applications')
          .update(updates)
          .eq('reference_code', referenceId)
          .select('*')
          .single();
        if (appRow) {
          updatedApp = {
            ...mapDbApplication(appRow),
            id: String(appRow.reference_code || appRow.id),
          };
        }
      }

      return {
        status: 200,
        body: {
          ok: true,
          application: updatedApp,
        },
      };
    }

    // Studio Desk (Teamwork & Internal Tasks) CRUD
    if (method === 'POST' && pathClean === '/api/studio/desk') {
      const b = (req.body || {}) as Partial<StudioItem>;
      const title = String(b.title || '').trim();
      if (!title) {
        return {
          status: 400,
          body: { ok: false, message: 'Task title is required.' },
        };
      }
      const { data, error } = await supabase
        .from('studio_items')
        .insert({
          stream: STUDIO_ITEM_STREAMS.includes(b.stream as StudioStream)
            ? b.stream
            : 'Studio',
          title,
          status: STUDIO_ITEM_STATUSES.some((s) => s.value === b.status)
            ? b.status
            : 'queued',
          assignee_name: String(b.assigneeName || '').trim(),
          assignee_email: String(b.assigneeEmail || '').trim(),
          due_date: b.dueDate ? String(b.dueDate).slice(0, 10) : null,
          notes: String(b.notes || '').trim(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 201, body: { ok: true, item: mapDbStudioItem(data) } };
    }

    if (method === 'PATCH' && pathClean.startsWith('/api/studio/desk/')) {
      const id = pathClean.slice('/api/studio/desk/'.length);
      const b = (req.body || {}) as Partial<StudioItem>;
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (typeof b.title === 'string' && b.title.trim()) {
        updates.title = b.title.trim();
      }
      if (b.stream && STUDIO_ITEM_STREAMS.includes(b.stream)) {
        updates.stream = b.stream;
      }
      if (b.status && STUDIO_ITEM_STATUSES.some((s) => s.value === b.status)) {
        updates.status = b.status;
      }
      if (typeof b.assigneeName === 'string') {
        updates.assignee_name = b.assigneeName.trim();
      }
      if (typeof b.assigneeEmail === 'string') {
        updates.assignee_email = b.assigneeEmail.trim();
      }
      if (typeof b.dueDate === 'string') {
        updates.due_date = b.dueDate.trim() ? b.dueDate.slice(0, 10) : null;
      }
      if (typeof b.notes === 'string') {
        updates.notes = b.notes.trim();
      }

      const { data, error } = await supabase
        .from('studio_items')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true, item: mapDbStudioItem(data) } };
    }

    if (method === 'DELETE' && pathClean.startsWith('/api/studio/desk/')) {
      const id = pathClean.slice('/api/studio/desk/'.length);
      const { error } = await supabase.from('studio_items').delete().eq('id', id);
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true } };
    }

    // Studio Ventures CRUD (Add / Update / Delete Apps Displayed on Home)
    if (method === 'POST' && pathClean === '/api/studio/ventures') {
      const b = (req.body || {}) as Partial<VentureRecord>;
      const name = String(b.name || '').trim();
      const headline = String(b.headline || '').trim();
      if (!name || !headline) {
        return {
          status: 400,
          body: { ok: false, message: 'Venture name and headline are required.' },
        };
      }
      const slug = slugifyTitle(String(b.slug || name)) || `app-${Date.now()}`;
      const { data, error } = await supabase
        .from('ventures')
        .insert({
          slug,
          name,
          stage_label: String(b.stageLabel || 'In build').trim(),
          headline,
          summary: String(b.summary || '').trim(),
          url: String(b.url || '').trim(),
          cta_label: String(b.ctaLabel || '').trim(),
          image_src: String(b.imageSrc || '').trim(),
          image_alt: String(b.imageAlt || '').trim(),
          highlights: Array.isArray(b.highlights)
            ? b.highlights.map((h) => String(h).trim()).filter(Boolean)
            : [],
          status: VENTURE_STATUSES.some((s) => s.value === b.status)
            ? b.status
            : 'building',
          featured: Boolean(b.featured),
          sort_order: Number(b.sortOrder) || 10,
          published: b.published !== false,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 201, body: { ok: true, venture: mapDbVenture(data) } };
    }

    if (method === 'PATCH' && pathClean.startsWith('/api/studio/ventures/')) {
      const id = pathClean.slice('/api/studio/ventures/'.length);
      const b = (req.body || {}) as Partial<VentureRecord>;
      const name = String(b.name || '').trim();
      const headline = String(b.headline || '').trim();
      if (!name || !headline) {
        return {
          status: 400,
          body: { ok: false, message: 'Venture name and headline are required.' },
        };
      }
      const slug = slugifyTitle(String(b.slug || name)) || `app-${Date.now()}`;
      const { data, error } = await supabase
        .from('ventures')
        .update({
          slug,
          name,
          stage_label: String(b.stageLabel || 'In build').trim(),
          headline,
          summary: String(b.summary || '').trim(),
          url: String(b.url || '').trim(),
          cta_label: String(b.ctaLabel || '').trim(),
          image_src: String(b.imageSrc || '').trim(),
          image_alt: String(b.imageAlt || '').trim(),
          highlights: Array.isArray(b.highlights)
            ? b.highlights.map((h) => String(h).trim()).filter(Boolean)
            : [],
          status: VENTURE_STATUSES.some((s) => s.value === b.status)
            ? b.status
            : 'building',
          featured: Boolean(b.featured),
          sort_order: Number(b.sortOrder) || 10,
          published: b.published !== false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true, venture: mapDbVenture(data) } };
    }

    if (method === 'DELETE' && pathClean.startsWith('/api/studio/ventures/')) {
      const id = pathClean.slice('/api/studio/ventures/'.length);
      const { error } = await supabase.from('ventures').delete().eq('id', id);
      if (error) {
        return { status: 400, body: { ok: false, message: error.message } };
      }
      return { status: 200, body: { ok: true } };
    }
  }

  return { status: 404, body: { ok: false, message: 'API route not found.' } };
}
