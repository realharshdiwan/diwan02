import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { estimateReadingMinutes, slugifyTitle } from '@/src/lib/markdown';
import {
  APPLICATION_STATUSES,
  SITE,
  STUDIO_ITEM_STATUSES,
  STUDIO_ITEM_STREAMS,
  VENTURE_STATUSES,
  type ApplicationRecord,
  type ApplicationStatus,
  type CohortRecord,
  type InternshipRole,
  type PostStatus,
  type ResearchKind,
  type ResearchPost,
  type StudioItem,
  type StudioItemStatus,
  type StudioStream,
  type VentureRecord,
  type VentureStatus,
} from '@/src/lib/site';
import { MarkdownBody } from './MarkdownBody';
import { Label } from './Ui';

interface StudioViewProps {
  onNavigate: (href: string) => void;
}

type StudioTab = 'notes' | 'ventures' | 'cohorts' | 'candidates' | 'desk';

interface StudioConfig {
  supabaseConfigured: boolean;
  serviceConfigured: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

interface CandidateRow extends ApplicationRecord {
  dbId?: string;
}

const STUDIO_TABS: readonly {
  id: StudioTab;
  label: string;
  subtitle: string;
}[] = [
  { id: 'notes', label: 'Field Notes', subtitle: 'Research posts & links' },
  { id: 'ventures', label: 'Ventures', subtitle: 'Apps & products displayed' },
  { id: 'cohorts', label: 'Cohorts', subtitle: 'Cycles & open briefs' },
  { id: 'candidates', label: 'Candidates', subtitle: 'Applications queue' },
  { id: 'desk', label: 'Desk', subtitle: 'Teamwork & operations' },
];

const BASIS_PRESETS = [
  'Product build note',
  'Architecture synthesis',
  'Technical build log',
  'Field visit',
  'Desk synthesis',
  'Open question',
  'Curated reading',
];

function emptyPost(): ResearchPost {
  return {
    id: '',
    slug: '',
    title: '',
    dek: '',
    bodyMd: '',
    kind: 'note',
    basis: 'Product build note',
    tags: [],
    sourceUrl: '',
    sourceLabel: '',
    status: 'draft',
    readingMinutes: 1,
    publishedAt: new Date().toISOString(),
  };
}

function emptyCohort(): CohortRecord {
  return {
    id: '',
    slug: 'cohort-next',
    title: 'New Cohort',
    windowLabel: '8–12 weeks',
    summary: '',
    terms: [
      { label: 'Format', value: '8–12 weeks · Unpaid · Certificate & LOR' },
      { label: 'Schedule', value: '10–25 hrs/week · Remote or Bengaluru' },
      { label: 'Selection', value: 'Application → 20-min call → 4-hr work sample' },
    ],
    roles: [
      {
        id: 'role-01',
        number: '01',
        title: 'Product Research Intern',
        focus: '',
        workSample: '',
        commitment: '10–20 hrs/wk',
        stipend: 'Unpaid',
      },
    ],
    status: 'upcoming',
  };
}

function emptyVenture(): VentureRecord {
  return {
    id: '',
    slug: '',
    name: '',
    stageLabel: 'In build',
    headline: '',
    summary: '',
    url: '',
    ctaLabel: '',
    imageSrc: '',
    imageAlt: '',
    highlights: [],
    status: 'building',
    featured: false,
    sortOrder: 10,
    published: true,
  };
}

function formatDateShort(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function StudioView({ onNavigate }: StudioViewProps) {
  const [config, setConfig] = useState<StudioConfig | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginSent, setLoginSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null,
  );

  const [activeTab, setActiveTab] = useState<StudioTab>('notes');
  const [signedInEmail, setSignedInEmail] = useState<string>('');

  // Overview state
  const [posts, setPosts] = useState<ResearchPost[]>([]);
  const [ventures, setVentures] = useState<VentureRecord[]>([]);
  const [cohorts, setCohorts] = useState<CohortRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [deskItems, setDeskItems] = useState<StudioItem[]>([]);

  // Field Notes Editor state
  const [editingPost, setEditingPost] = useState<ResearchPost>(emptyPost());
  const [tagsText, setTagsText] = useState('');
  const [editorMode, setEditorMode] = useState<'write' | 'preview'>('write');
  const [savingPost, setSavingPost] = useState(false);

  // Ventures Editor state
  const [editingVenture, setEditingVenture] =
    useState<VentureRecord>(emptyVenture());
  const [highlightsText, setHighlightsText] = useState('');
  const [savingVenture, setSavingVenture] = useState(false);

  // Cohort Editor state
  const [editingCohort, setEditingCohort] = useState<CohortRecord>(emptyCohort());
  const [savingCohort, setSavingCohort] = useState(false);

  // Candidates triage state
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<
    'all' | ApplicationStatus
  >('all');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [reviewerDraft, setReviewerDraft] = useState('');
  const [savingCandidate, setSavingCandidate] = useState(false);

  // Desk state
  const [deskStreamFilter, setDeskStreamFilter] = useState<'all' | StudioStream>(
    'all',
  );
  const [deskSearch, setDeskSearch] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStream, setNewTaskStream] = useState<StudioStream>('Sikka');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [savingDesk, setSavingDesk] = useState(false);

  // 1. Load Supabase public client config (supports both VITE_ and runtime env)
  useEffect(() => {
    let active = true;
    const viteUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
    const viteKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

    fetch('/api/studio/config')
      .then((res) => res.json())
      .then((data: Partial<StudioConfig>) => {
        if (!active) return;
        const url = data.supabaseUrl || viteUrl;
        const anonKey = data.supabaseAnonKey || viteKey;
        const resolved: StudioConfig = {
          supabaseConfigured: Boolean(url && anonKey),
          serviceConfigured: Boolean(data.serviceConfigured),
          supabaseUrl: url,
          supabaseAnonKey: anonKey,
        };
        setConfig(resolved);
        if (url && anonKey) {
          const supa = createClient(url, anonKey);
          setClient(supa);
        }
      })
      .catch(() => {
        if (!active) return;
        const resolved: StudioConfig = {
          supabaseConfigured: Boolean(viteUrl && viteKey),
          serviceConfigured: false,
          supabaseUrl: viteUrl,
          supabaseAnonKey: viteKey,
        };
        setConfig(resolved);
        if (viteUrl && viteKey) {
          setClient(createClient(viteUrl, viteKey));
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // 2. Track Supabase auth session
  useEffect(() => {
    if (!client) return;
    let active = true;
    client.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      if (active) setSession(next);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      const res = await fetch(path, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(init?.headers || {}),
        },
      });
      const json = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(String(json.message || 'Request failed'));
      }
      return json;
    },
    [session],
  );

  const loadOverview = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingOverview(true);
    setAuthError(null);
    try {
      const data = (await apiFetch('/api/studio/overview')) as {
        user?: { email?: string };
        posts?: ResearchPost[];
        ventures?: VentureRecord[];
        cohorts?: CohortRecord[];
        applications?: CandidateRow[];
        studioItems?: StudioItem[];
      };
      setSignedInEmail(data.user?.email || session.user?.email || '');
      const loadedPosts = data.posts || [];
      const loadedVentures = data.ventures || [];
      const loadedCohorts = data.cohorts || [];
      const loadedApps = data.applications || [];
      setPosts(loadedPosts);
      setVentures(loadedVentures);
      setCohorts(loadedCohorts);
      setCandidates(loadedApps);
      setDeskItems(data.studioItems || []);

      if (loadedPosts.length > 0 && !editingPost.id) {
        setEditingPost(loadedPosts[0]);
        setTagsText(loadedPosts[0].tags.join(', '));
      }
      if (loadedVentures.length > 0 && !editingVenture.id) {
        setEditingVenture(loadedVentures[0]);
        setHighlightsText(loadedVentures[0].highlights.join('\n'));
      }
      if (loadedCohorts.length > 0 && !editingCohort.id) {
        setEditingCohort(loadedCohorts[0]);
      }
      if (loadedApps.length > 0 && !selectedCandidateId) {
        setSelectedCandidateId(loadedApps[0].id);
        setReviewerDraft(loadedApps[0].reviewerNotes || '');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to open Studio Ledger';
      setAuthError(msg);
    } finally {
      setLoadingOverview(false);
    }
  }, [
    apiFetch,
    editingCohort.id,
    editingPost.id,
    editingVenture.id,
    selectedCandidateId,
    session,
  ]);

  useEffect(() => {
    if (session?.access_token) {
      loadOverview();
    }
  }, [session?.access_token, loadOverview]);

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setAuthError(null);
    setLoginSent(false);
    const email = loginEmail.trim();
    if (!email) {
      setAuthError('Enter your studio email address.');
      return;
    }
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/studio`,
      },
    });
    if (error) {
      setAuthError(error.message);
      return;
    }
    setLoginSent(true);
  };

  const handleSignOut = async () => {
    if (client) await client.auth.signOut();
    setSession(null);
    setSignedInEmail('');
    setNotice(null);
  };

  // ── Field Notes Handlers ──────────────────────────────────────────────────
  const selectPostForEdit = (post: ResearchPost) => {
    setEditingPost(post);
    setTagsText(post.tags.join(', '));
    setEditorMode('write');
    setNotice(null);
  };

  const handleSavePost = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPost(true);
    setNotice(null);
    try {
      const parsedTags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = { ...editingPost, tags: parsedTags };
      const res = editingPost.id
        ? ((await apiFetch(`/api/studio/posts/${editingPost.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })) as { post: ResearchPost })
        : ((await apiFetch('/api/studio/posts', {
            method: 'POST',
            body: JSON.stringify(payload),
          })) as { post: ResearchPost });

      setPosts((prev) => {
        const exists = prev.some((p) => p.id === res.post.id);
        return exists
          ? prev.map((p) => (p.id === res.post.id ? res.post : p))
          : [res.post, ...prev];
      });
      setEditingPost(res.post);
      setTagsText(res.post.tags.join(', '));
      setNotice({ kind: 'ok', text: `Saved "${res.post.title}".` });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Failed to save post.',
      });
    } finally {
      setSavingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!postId) return;
    setNotice(null);
    try {
      await apiFetch(`/api/studio/posts/${postId}`, { method: 'DELETE' });
      const remaining = posts.filter((p) => p.id !== postId);
      setPosts(remaining);
      const next = remaining[0] || emptyPost();
      setEditingPost(next);
      setTagsText(next.tags.join(', '));
      setNotice({ kind: 'ok', text: 'Entry deleted.' });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Delete failed.',
      });
    }
  };

  // ── Ventures Handlers ─────────────────────────────────────────────────────
  const selectVentureForEdit = (venture: VentureRecord) => {
    setEditingVenture(venture);
    setHighlightsText(venture.highlights.join('\n'));
    setNotice(null);
  };

  const handleSaveVenture = async (e: FormEvent) => {
    e.preventDefault();
    setSavingVenture(true);
    setNotice(null);
    try {
      const parsedHighlights = highlightsText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const payload = { ...editingVenture, highlights: parsedHighlights };
      const res = editingVenture.id
        ? ((await apiFetch(`/api/studio/ventures/${editingVenture.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })) as { venture: VentureRecord })
        : ((await apiFetch('/api/studio/ventures', {
            method: 'POST',
            body: JSON.stringify(payload),
          })) as { venture: VentureRecord });

      setVentures((prev) => {
        const exists = prev.some((v) => v.id === res.venture.id);
        return exists
          ? prev.map((v) => (v.id === res.venture.id ? res.venture : v))
          : [...prev, res.venture];
      });
      setEditingVenture(res.venture);
      setHighlightsText(res.venture.highlights.join('\n'));
      setNotice({ kind: 'ok', text: `Saved app "${res.venture.name}".` });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Failed to save venture.',
      });
    } finally {
      setSavingVenture(false);
    }
  };

  const handleDeleteVenture = async (ventureId: string) => {
    if (!ventureId) return;
    setNotice(null);
    try {
      await apiFetch(`/api/studio/ventures/${ventureId}`, { method: 'DELETE' });
      const remaining = ventures.filter((v) => v.id !== ventureId);
      setVentures(remaining);
      const next = remaining[0] || emptyVenture();
      setEditingVenture(next);
      setHighlightsText(next.highlights.join('\n'));
      setNotice({ kind: 'ok', text: 'Venture deleted.' });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Delete failed.',
      });
    }
  };

  // ── Cohorts Handlers ──────────────────────────────────────────────────────
  const updateCohortRole = (
    idx: number,
    patch: Partial<InternshipRole>,
  ) => {
    setEditingCohort((prev) => ({
      ...prev,
      roles: prev.roles.map((r, i) => (i === idx ? { ...r, ...patch } : r)),
    }));
  };

  const addCohortRole = () => {
    setEditingCohort((prev) => {
      const nextNum = String(prev.roles.length + 1).padStart(2, '0');
      return {
        ...prev,
        roles: [
          ...prev.roles,
          {
            id: `role-${Date.now()}`,
            number: nextNum,
            title: 'New Role',
            focus: '',
            workSample: '',
            commitment: '10–20 hrs/wk',
            stipend: 'Unpaid',
          },
        ],
      };
    });
  };

  const removeCohortRole = (idx: number) => {
    setEditingCohort((prev) => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== idx),
    }));
  };

  const handleSaveCohort = async (e: FormEvent) => {
    e.preventDefault();
    setSavingCohort(true);
    setNotice(null);
    try {
      const res = editingCohort.id
        ? ((await apiFetch(`/api/studio/cohorts/${editingCohort.id}`, {
            method: 'PATCH',
            body: JSON.stringify(editingCohort),
          })) as { cohort: CohortRecord })
        : ((await apiFetch('/api/studio/cohorts', {
            method: 'POST',
            body: JSON.stringify(editingCohort),
          })) as { cohort: CohortRecord });

      setCohorts((prev) => {
        const exists = prev.some((c) => c.id === res.cohort.id);
        return exists
          ? prev.map((c) => (c.id === res.cohort.id ? res.cohort : c))
          : [res.cohort, ...prev];
      });
      setEditingCohort(res.cohort);
      setNotice({ kind: 'ok', text: `Saved ${res.cohort.title}.` });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Failed to save cohort.',
      });
    } finally {
      setSavingCohort(false);
    }
  };

  // ── Candidates Handlers ───────────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    return candidates.filter((c) => {
      if (candidateStatusFilter !== 'all' && c.status !== candidateStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
      );
    });
  }, [candidates, candidateSearch, candidateStatusFilter]);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) || null,
    [candidates, selectedCandidateId],
  );

  const handleUpdateCandidate = async (
    referenceId: string,
    updates: { status?: ApplicationStatus; reviewerNotes?: string },
  ) => {
    setSavingCandidate(true);
    setNotice(null);
    try {
      const res = (await apiFetch(
        `/api/studio/applications/${encodeURIComponent(referenceId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        },
      )) as { application: CandidateRow };
      setCandidates((prev) =>
        prev.map((c) => (c.id === referenceId ? res.application : c)),
      );
      setNotice({ kind: 'ok', text: `Updated ${referenceId}.` });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Update failed.',
      });
    } finally {
      setSavingCandidate(false);
    }
  };

  const handleExportCsv = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/studio/applications.csv', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Could not export CSV');
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diwan-mercantile-candidates.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'CSV export failed.',
      });
    }
  };

  // ── Desk (Teamwork & Operations) Handlers ─────────────────────────────────
  const filteredDesk = useMemo(() => {
    const q = deskSearch.trim().toLowerCase();
    return deskItems.filter((item) => {
      if (deskStreamFilter !== 'all' && item.stream !== deskStreamFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.assigneeName.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [deskItems, deskSearch, deskStreamFilter]);

  const handleCreateDeskItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setSavingDesk(true);
    setNotice(null);
    try {
      const res = (await apiFetch('/api/studio/desk', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          stream: newTaskStream,
          assigneeName: newTaskAssignee.trim(),
          dueDate: newTaskDue,
          notes: newTaskNotes.trim(),
          status: 'queued',
        }),
      })) as { item: StudioItem };
      setDeskItems((prev) => [res.item, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNotice({ kind: 'ok', text: `Added "${res.item.title}".` });
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Failed to create item.',
      });
    } finally {
      setSavingDesk(false);
    }
  };

  const handleUpdateDeskStatus = async (
    id: string,
    status: StudioItemStatus,
  ) => {
    try {
      const res = (await apiFetch(`/api/studio/desk/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })) as { item: StudioItem };
      setDeskItems((prev) => prev.map((it) => (it.id === id ? res.item : it)));
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Status update failed.',
      });
    }
  };

  const handleDeleteDeskItem = async (id: string) => {
    try {
      await apiFetch(`/api/studio/desk/${id}`, { method: 'DELETE' });
      setDeskItems((prev) => prev.filter((it) => it.id !== id));
    } catch (err) {
      setNotice({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Delete failed.',
      });
    }
  };

  // ── Render: Loading / Unconfigured / Sign-In Gate ─────────────────────────
  if (!config) {
    return (
      <div className="gutter flex min-h-dvh items-center justify-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink-3">
          Loading Studio Ledger…
        </p>
      </div>
    );
  }

  if (!config.supabaseConfigured || !config.serviceConfigured) {
    return (
      <div className="gutter min-h-dvh py-12">
        <div className="mx-auto max-w-[44rem]">
          <div className="flex items-baseline justify-between border-b border-line pb-5">
            <div>
              <Label>Diwan Mercantile</Label>
              <h1 className="mt-1 text-[1.75rem] font-medium tracking-[-0.03em] text-accent">
                Studio Ledger
              </h1>
            </div>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="text-[14px] text-ink underline decoration-line underline-offset-4 hover:text-accent"
            >
              ← Public site
            </a>
          </div>

          <div className="mt-8 space-y-5">
            <h2 className="text-[1.25rem] font-medium text-ink">
              Connect Supabase to unlock private Studio operations.
            </h2>
            <p className="text-[15px] leading-[1.68] text-ink-2">
              The public Research journal and Careers application routes remain
              live. To sign in and manage Field Notes, Cohorts, Candidates, and
              Desk tasks in Postgres:
            </p>
            <ol className="divide-y divide-line border-y border-line text-[14.5px] leading-[1.6] text-ink">
              <li className="py-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                  Step 01 ·{' '}
                </span>
                Create a Supabase project and run the SQL in{' '}
                <code className="font-mono text-[13px]">supabase/schema.sql</code>.
              </li>
              <li className="py-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                  Step 02 ·{' '}
                </span>
                Add <code className="font-mono text-[13px]">SUPABASE_URL</code>,{' '}
                <code className="font-mono text-[13px]">SUPABASE_ANON_KEY</code>,{' '}
                <code className="font-mono text-[13px]">SUPABASE_SERVICE_ROLE_KEY</code>, and{' '}
                <code className="font-mono text-[13px]">STUDIO_ALLOWED_EMAILS</code>{' '}
                to Vercel Environment Variables (or AI Studio Secrets).
              </li>
              <li className="py-3.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                  Step 03 ·{' '}
                </span>
                Add your production URL + <code className="font-mono text-[13px]">/studio</code>{' '}
                under Supabase Authentication → URL Configuration → Redirect URLs.
              </li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  if (!session || authError) {
    return (
      <div className="gutter flex min-h-dvh items-center justify-center py-12">
        <div className="w-full max-w-[28rem] border border-line bg-paper p-7 sm:p-8">
          <div className="flex items-baseline justify-between">
            <Label>Private Workspace</Label>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3 underline decoration-line underline-offset-4 hover:text-accent"
            >
              Public site
            </a>
          </div>
          <h1 className="mt-2 text-[1.75rem] font-medium tracking-[-0.03em] text-accent">
            Studio Ledger
          </h1>
          <p className="mt-2 text-[14.5px] leading-[1.6] text-ink-2">
            Sign in with your allowlisted studio email to manage Field Notes,
            Cohorts, Candidates, and Desk tasks.
          </p>

          {session && authError ? (
            <div className="mt-6 space-y-4">
              <p role="alert" className="text-[14px] text-accent">
                {authError}
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                className="cursor-pointer border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field"
              >
                Switch account
              </button>
            </div>
          ) : loginSent ? (
            <div role="status" className="mt-6 border border-accent bg-field p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                Sign-in link dispatched
              </p>
              <p className="mt-1.5 text-[14px] leading-[1.55] text-ink">
                Check <strong>{loginEmail}</strong> and open the verification link
                to enter Studio Ledger.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="mt-6 space-y-4">
              <div>
                <label htmlFor="studio-email" className="label mb-2 block">
                  Studio Email
                </label>
                <input
                  id="studio-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="diwanharsh33@gmail.com"
                  className="w-full border border-line bg-field px-3.5 py-2.5 text-[15px] text-ink"
                />
              </div>
              {authError && (
                <p role="alert" className="text-[13.5px] text-accent">
                  {authError}
                </p>
              )}
              <button
                type="submit"
                className="w-full cursor-pointer border border-ink bg-ink px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-field transition-colors hover:border-accent hover:bg-accent"
              >
                Send magic link
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const currentTabMeta = STUDIO_TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-dvh bg-field lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* ── Left Workspace Rail (248px) ───────────────────────────── */}
      <aside className="flex flex-col justify-between border-b border-line bg-paper p-5 lg:border-b-0 lg:border-r">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="text-[1.125rem] font-medium tracking-[-0.025em] text-accent"
            >
              {SITE.name}
            </a>
            <span className="label">Studio</span>
          </div>

          <nav aria-label="Studio workspace" className="mt-8 space-y-1">
            {STUDIO_TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setNotice(null);
                  }}
                  className={`flex w-full cursor-pointer items-baseline justify-between px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'bg-ink text-field'
                      : 'text-ink-2 hover:bg-field hover:text-ink'
                  }`}
                >
                  <span className="text-[14px] font-medium whitespace-nowrap">
                    {tab.label}
                  </span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      active ? 'text-field/80' : 'text-ink-3'
                    }`}
                  >
                    {tab.id === 'notes'
                      ? posts.length
                      : tab.id === 'ventures'
                        ? ventures.length
                        : tab.id === 'cohorts'
                          ? cohorts.length
                          : tab.id === 'candidates'
                            ? candidates.length
                            : deskItems.length}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-8 border-t border-line pt-4">
          <p className="truncate font-mono text-[11px] text-ink-3">
            {signedInEmail}
          </p>
          <p className="mt-1 font-mono text-[10.5px] text-ink-3">
            Shortcut: Ctrl+Shift+L
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 underline decoration-line underline-offset-4 hover:text-accent"
            >
              Public site
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 underline decoration-line underline-offset-4 hover:text-accent"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Studio Viewport ──────────────────────────────────── */}
      <div className="flex min-w-0 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-paper px-6 py-4">
          <div className="flex items-baseline gap-2 text-[14px]">
            <span className="label">Studio Ledger</span>
            <span className="text-ink-3">/</span>
            <h1 className="font-medium text-ink">{currentTabMeta.label}</h1>
            <span className="hidden text-[13px] text-ink-3 sm:inline">
              · {currentTabMeta.subtitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'notes' && (
              <button
                type="button"
                onClick={() => {
                  setEditingPost(emptyPost());
                  setTagsText('');
                  setEditorMode('write');
                }}
                className="cursor-pointer whitespace-nowrap border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field transition-colors hover:border-accent hover:bg-accent"
              >
                New entry
              </button>
            )}
            {activeTab === 'ventures' && (
              <button
                type="button"
                onClick={() => {
                  setEditingVenture(emptyVenture());
                  setHighlightsText('');
                }}
                className="cursor-pointer whitespace-nowrap border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field transition-colors hover:border-accent hover:bg-accent"
              >
                New app
              </button>
            )}
            {activeTab === 'cohorts' && (
              <button
                type="button"
                onClick={() => setEditingCohort(emptyCohort())}
                className="cursor-pointer whitespace-nowrap border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field transition-colors hover:border-accent hover:bg-accent"
              >
                New cohort
              </button>
            )}
            {activeTab === 'candidates' && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="cursor-pointer whitespace-nowrap border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field transition-colors hover:border-accent hover:bg-accent"
              >
                Download CSV
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">
          {notice && (
            <div
              role="status"
              className={`mb-5 border px-4 py-2.5 text-[13.5px] ${
                notice.kind === 'ok'
                  ? 'border-line bg-paper text-ink'
                  : 'border-accent bg-paper text-accent'
              }`}
            >
              {notice.text}
            </div>
          )}

          {loadingOverview && posts.length === 0 ? (
            <p className="font-mono text-[12px] text-ink-3">
              Loading Studio records…
            </p>
          ) : null}

          {/* ── 01. FIELD NOTES ───────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
              <div className="border border-line bg-paper">
                <div className="border-b border-line px-4 py-3">
                  <Label>Entries ({posts.length})</Label>
                </div>
                {posts.length === 0 ? (
                  <p className="p-4 text-[13.5px] text-ink-2">
                    No entries yet. Draft your first field note or curated link.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {posts.map((post) => {
                      const active = editingPost.id === post.id;
                      return (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => selectPostForEdit(post)}
                            className={`w-full cursor-pointer px-4 py-3.5 text-left transition-colors ${
                              active ? 'bg-field' : 'hover:bg-field/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em]">
                              <span className="text-accent">{post.kind}</span>
                              <span className="text-ink-3">{post.status}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-[14px] font-medium leading-[1.35] text-ink">
                              {post.title}
                            </p>
                            <p className="mt-1 text-[12px] text-ink-3">
                              {post.basis}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form
                onSubmit={handleSavePost}
                className="space-y-5 border border-line bg-paper p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <div className="flex items-center gap-1">
                    {(['write', 'preview'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setEditorMode(mode)}
                        className={`cursor-pointer px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${
                          editorMode === mode
                            ? 'bg-ink text-field'
                            : 'text-ink-2 hover:text-ink'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    {editingPost.id && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(editingPost.id)}
                        className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3 underline underline-offset-4 hover:text-accent"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingPost}
                      className="cursor-pointer border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
                    >
                      {savingPost ? 'Saving…' : 'Save entry'}
                    </button>
                  </div>
                </div>

                {editorMode === 'preview' ? (
                  <div className="max-w-[60ch] space-y-4 py-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                      {editingPost.kind} · {editingPost.basis} ·{' '}
                      {estimateReadingMinutes(editingPost.bodyMd || editingPost.title)} min read
                    </p>
                    <h2 className="text-[1.85rem] leading-[1.15] tracking-[-0.03em] text-ink">
                      {editingPost.title || 'Untitled entry'}
                    </h2>
                    {editingPost.dek && (
                      <p className="text-[16px] leading-[1.6] text-ink-2">
                        {editingPost.dek}
                      </p>
                    )}
                    <div className="border-t border-line pt-5">
                      <MarkdownBody markdown={editingPost.bodyMd} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="post-title" className="label mb-1.5 block">
                          Title
                        </label>
                        <input
                          id="post-title"
                          type="text"
                          required
                          value={editingPost.title}
                          onChange={(e) => {
                            const title = e.target.value;
                            setEditingPost((prev) => ({
                              ...prev,
                              title,
                              slug: prev.id ? prev.slug : slugifyTitle(title),
                            }));
                          }}
                          className="w-full border border-line bg-field px-3 py-2 text-[14.5px] text-ink"
                        />
                      </div>
                      <div>
                        <label htmlFor="post-slug" className="label mb-1.5 block">
                          Slug (/research/slug)
                        </label>
                        <input
                          id="post-slug"
                          type="text"
                          required
                          value={editingPost.slug}
                          onChange={(e) =>
                            setEditingPost((prev) => ({
                              ...prev,
                              slug: slugifyTitle(e.target.value),
                            }))
                          }
                          className="w-full border border-line bg-field px-3 py-2 font-mono text-[13px] text-ink"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="post-kind" className="label mb-1.5 block">
                          Kind
                        </label>
                        <select
                          id="post-kind"
                          value={editingPost.kind}
                          onChange={(e) =>
                            setEditingPost((prev) => ({
                              ...prev,
                              kind: e.target.value as ResearchKind,
                            }))
                          }
                          className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                        >
                          <option value="note">Note</option>
                          <option value="essay">Essay</option>
                          <option value="link">Curated link</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="post-basis" className="label mb-1.5 block">
                          Honest Basis Tag
                        </label>
                        <input
                          id="post-basis"
                          list="basis-presets"
                          value={editingPost.basis}
                          onChange={(e) =>
                            setEditingPost((prev) => ({
                              ...prev,
                              basis: e.target.value,
                            }))
                          }
                          className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                        />
                        <datalist id="basis-presets">
                          {BASIS_PRESETS.map((b) => (
                            <option key={b} value={b} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label htmlFor="post-status" className="label mb-1.5 block">
                          Status
                        </label>
                        <select
                          id="post-status"
                          value={editingPost.status}
                          onChange={(e) =>
                            setEditingPost((prev) => ({
                              ...prev,
                              status: e.target.value as PostStatus,
                            }))
                          }
                          className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                        >
                          <option value="draft">Draft (hidden)</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="post-dek" className="label mb-1.5 block">
                        Summary / Reason for sharing
                      </label>
                      <input
                        id="post-dek"
                        type="text"
                        value={editingPost.dek}
                        onChange={(e) =>
                          setEditingPost((prev) => ({
                            ...prev,
                            dek: e.target.value,
                          }))
                        }
                        className="w-full border border-line bg-field px-3 py-2 text-[14.5px] text-ink"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="post-tags" className="label mb-1.5 block">
                          Topics (comma-separated)
                        </label>
                        <input
                          id="post-tags"
                          type="text"
                          value={tagsText}
                          onChange={(e) => setTagsText(e.target.value)}
                          placeholder="retail, architecture"
                          className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                        />
                      </div>
                      <div>
                        <label htmlFor="post-source-url" className="label mb-1.5 block">
                          Source URL (for link posts)
                        </label>
                        <input
                          id="post-source-url"
                          type="url"
                          value={editingPost.sourceUrl}
                          onChange={(e) =>
                            setEditingPost((prev) => ({
                              ...prev,
                              sourceUrl: e.target.value,
                            }))
                          }
                          placeholder="https://"
                          className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                        />
                      </div>
                      <div>
                        <label htmlFor="post-source-label" className="label mb-1.5 block">
                          Source Domain Label
                        </label>
                        <input
                          id="post-source-label"
                          type="text"
                          value={editingPost.sourceLabel}
                          onChange={(e) =>
                            setEditingPost((prev) => ({
                              ...prev,
                              sourceLabel: e.target.value,
                            }))
                          }
                          placeholder="inkandswitch.com"
                          className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="post-body" className="label mb-1.5 block">
                        Body (Markdown)
                      </label>
                      <textarea
                        id="post-body"
                        rows={13}
                        value={editingPost.bodyMd}
                        onChange={(e) =>
                          setEditingPost((prev) => ({
                            ...prev,
                            bodyMd: e.target.value,
                          }))
                        }
                        placeholder="Write clear observations, markdown headings (##), bullet lists, and links..."
                        className="w-full border border-line bg-field px-3.5 py-3 font-mono text-[13px] leading-[1.65] text-ink"
                      />
                    </div>
                  </>
                )}
              </form>
            </div>
          )}

          {/* ── 01B. VENTURES (APPS ON HOME DISPLAY AREA) ─────────── */}
          {activeTab === 'ventures' && (
            <div className="grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
              <div className="border border-line bg-paper">
                <div className="border-b border-line px-4 py-3">
                  <Label>Apps &amp; Ventures ({ventures.length})</Label>
                </div>
                {ventures.length === 0 ? (
                  <p className="p-4 text-[13.5px] text-ink-2">
                    No ventures logged yet. Click &ldquo;New app&rdquo; to add one to the home display area.
                  </p>
                ) : (
                  <ul className="divide-y divide-line">
                    {ventures.map((venture) => {
                      const active = editingVenture.id === venture.id;
                      return (
                        <li key={venture.id || venture.slug}>
                          <button
                            type="button"
                            onClick={() => selectVentureForEdit(venture)}
                            className={`w-full cursor-pointer px-4 py-3.5 text-left transition-colors ${
                              active ? 'bg-field' : 'hover:bg-field/60'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em]">
                              <span className="text-accent">
                                {venture.stageLabel || venture.status}
                              </span>
                              <span className="text-ink-3">
                                {venture.published ? 'visible' : 'hidden'}
                              </span>
                            </div>
                            <p className="mt-1 text-[14.5px] font-medium text-ink">
                              {venture.name}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[12px] text-ink-3">
                              {venture.headline}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form
                onSubmit={handleSaveVenture}
                className="space-y-5 border border-line bg-paper p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <Label>Venture display entry (live on /#ventures)</Label>
                  <div className="flex items-center gap-3">
                    {editingVenture.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVenture(editingVenture.id)}
                        className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3 underline underline-offset-4 hover:text-accent"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={savingVenture}
                      className="cursor-pointer border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field transition-colors hover:border-accent hover:bg-accent disabled:opacity-60"
                    >
                      {savingVenture ? 'Saving…' : 'Save app'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="venture-name" className="label mb-1.5 block">
                      App / Venture Name
                    </label>
                    <input
                      id="venture-name"
                      type="text"
                      required
                      value={editingVenture.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setEditingVenture((prev) => ({
                          ...prev,
                          name,
                          slug: prev.id ? prev.slug : slugifyTitle(name),
                        }));
                      }}
                      placeholder="Sikka"
                      className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="venture-stage" className="label mb-1.5 block">
                      Stage Label
                    </label>
                    <input
                      id="venture-stage"
                      type="text"
                      value={editingVenture.stageLabel}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          stageLabel: e.target.value,
                        }))
                      }
                      placeholder="In build / Live venture"
                      className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="venture-status" className="label mb-1.5 block">
                      Status
                    </label>
                    <select
                      id="venture-status"
                      value={editingVenture.status}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          status: e.target.value as VentureStatus,
                        }))
                      }
                      className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                    >
                      {VENTURE_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="venture-headline" className="label mb-1.5 block">
                    Headline
                  </label>
                  <input
                    id="venture-headline"
                    type="text"
                    required
                    value={editingVenture.headline}
                    onChange={(e) =>
                      setEditingVenture((prev) => ({
                        ...prev,
                        headline: e.target.value,
                      }))
                    }
                    placeholder="Simple counter billing for busy retail shops."
                    className="w-full border border-line bg-field px-3 py-2 text-[14.5px] text-ink"
                  />
                </div>

                <div>
                  <label htmlFor="venture-summary" className="label mb-1.5 block">
                    Summary
                  </label>
                  <textarea
                    id="venture-summary"
                    rows={2}
                    value={editingVenture.summary}
                    onChange={(e) =>
                      setEditingVenture((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="venture-url" className="label mb-1.5 block">
                      App URL (optional)
                    </label>
                    <input
                      id="venture-url"
                      type="url"
                      value={editingVenture.url}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      placeholder="https://"
                      className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="venture-cta" className="label mb-1.5 block">
                      Link Label
                    </label>
                    <input
                      id="venture-cta"
                      type="text"
                      value={editingVenture.ctaLabel}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          ctaLabel: e.target.value,
                        }))
                      }
                      placeholder="Open Sikka"
                      className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="venture-image" className="label mb-1.5 block">
                      Preview Image Path / URL
                    </label>
                    <input
                      id="venture-image"
                      type="text"
                      value={editingVenture.imageSrc}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          imageSrc: e.target.value,
                        }))
                      }
                      placeholder="/sikka-preview.png"
                      className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="venture-highlights" className="label mb-1.5 block">
                    Key Highlights (one per line)
                  </label>
                  <textarea
                    id="venture-highlights"
                    rows={4}
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="Runs offline on the counter computer&#10;Instant CSV/JSON exports"
                    className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 border-t border-line pt-4">
                  <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink">
                    <input
                      type="checkbox"
                      checked={editingVenture.published}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          published: e.target.checked,
                        }))
                      }
                    />
                    Show on public site
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-ink">
                    <input
                      type="checkbox"
                      checked={editingVenture.featured}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          featured: e.target.checked,
                        }))
                      }
                    />
                    Primary showcase slot
                  </label>

                  <div className="flex items-center gap-2">
                    <label htmlFor="venture-order" className="label">
                      Order
                    </label>
                    <input
                      id="venture-order"
                      type="number"
                      value={editingVenture.sortOrder}
                      onChange={(e) =>
                        setEditingVenture((prev) => ({
                          ...prev,
                          sortOrder: Number(e.target.value) || 10,
                        }))
                      }
                      className="w-20 border border-line bg-field px-2.5 py-1 font-mono text-[12px] text-ink"
                    />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── 02. COHORTS ───────────────────────────────────────── */}
          {activeTab === 'cohorts' && (
            <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="border border-line bg-paper">
                <div className="border-b border-line px-4 py-3">
                  <Label>Cycles ({cohorts.length})</Label>
                </div>
                <ul className="divide-y divide-line">
                  {cohorts.map((cohort) => (
                    <li key={cohort.id}>
                      <button
                        type="button"
                        onClick={() => setEditingCohort(cohort)}
                        className={`w-full cursor-pointer px-4 py-3.5 text-left ${
                          editingCohort.id === cohort.id
                            ? 'bg-field'
                            : 'hover:bg-field/60'
                        }`}
                      >
                        <div className="flex justify-between font-mono text-[10.5px] uppercase tracking-[0.12em]">
                          <span className="text-accent">{cohort.status}</span>
                          <span className="text-ink-3">
                            {cohort.roles.length} roles
                          </span>
                        </div>
                        <p className="mt-1 text-[14.5px] font-medium text-ink">
                          {cohort.title}
                        </p>
                        <p className="mt-0.5 text-[12px] text-ink-3">
                          {cohort.windowLabel}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <form
                onSubmit={handleSaveCohort}
                className="space-y-5 border border-line bg-paper p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                  <Label>Cohort configuration (live on /careers)</Label>
                  <button
                    type="submit"
                    disabled={savingCohort}
                    className="cursor-pointer border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field hover:border-accent hover:bg-accent disabled:opacity-60"
                  >
                    {savingCohort ? 'Saving…' : 'Save cohort'}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="cohort-title" className="label mb-1.5 block">
                      Title
                    </label>
                    <input
                      id="cohort-title"
                      type="text"
                      required
                      value={editingCohort.title}
                      onChange={(e) =>
                        setEditingCohort((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="cohort-window" className="label mb-1.5 block">
                      Window
                    </label>
                    <input
                      id="cohort-window"
                      type="text"
                      value={editingCohort.windowLabel}
                      onChange={(e) =>
                        setEditingCohort((prev) => ({
                          ...prev,
                          windowLabel: e.target.value,
                        }))
                      }
                      className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                    />
                  </div>
                  <div>
                    <label htmlFor="cohort-status" className="label mb-1.5 block">
                      Status
                    </label>
                    <select
                      id="cohort-status"
                      value={editingCohort.status}
                      onChange={(e) =>
                        setEditingCohort((prev) => ({
                          ...prev,
                          status: e.target.value as CohortRecord['status'],
                        }))
                      }
                      className="w-full border border-line bg-field px-3 py-2 text-[14px] text-ink"
                    >
                      <option value="open">Open</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="cohort-summary" className="label mb-1.5 block">
                    Programme Intro
                  </label>
                  <textarea
                    id="cohort-summary"
                    rows={3}
                    value={editingCohort.summary}
                    onChange={(e) =>
                      setEditingCohort((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    className="w-full border border-line bg-field px-3 py-2 text-[14px] leading-[1.6] text-ink"
                  />
                </div>

                <div className="space-y-4 border-t border-line pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Open Roles &amp; 4-Hour Work Samples</Label>
                    <button
                      type="button"
                      onClick={addCohortRole}
                      className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.12em] text-accent underline underline-offset-4"
                    >
                      + Add role
                    </button>
                  </div>

                  {editingCohort.roles.map((role, idx) => (
                    <div
                      key={role.id}
                      className="space-y-3 border border-line bg-field p-4"
                    >
                      <div className="grid gap-3 sm:grid-cols-[4rem_minmax(0,1fr)_8rem_6rem_auto]">
                        <input
                          aria-label="Role number"
                          value={role.number}
                          onChange={(e) =>
                            updateCohortRole(idx, { number: e.target.value })
                          }
                          className="border border-line bg-paper px-2.5 py-1.5 font-mono text-[12px]"
                        />
                        <input
                          aria-label="Role title"
                          value={role.title}
                          onChange={(e) =>
                            updateCohortRole(idx, { title: e.target.value })
                          }
                          className="border border-line bg-paper px-2.5 py-1.5 text-[14px] font-medium"
                        />
                        <input
                          aria-label="Commitment"
                          value={role.commitment}
                          onChange={(e) =>
                            updateCohortRole(idx, { commitment: e.target.value })
                          }
                          className="border border-line bg-paper px-2.5 py-1.5 text-[13px]"
                        />
                        <input
                          aria-label="Stipend"
                          value={role.stipend}
                          onChange={(e) =>
                            updateCohortRole(idx, { stipend: e.target.value })
                          }
                          className="border border-line bg-paper px-2.5 py-1.5 text-[13px]"
                        />
                        <button
                          type="button"
                          onClick={() => removeCohortRole(idx)}
                          className="cursor-pointer px-2 font-mono text-[11px] uppercase text-ink-3 hover:text-accent"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        aria-label="Role focus"
                        value={role.focus}
                        onChange={(e) =>
                          updateCohortRole(idx, { focus: e.target.value })
                        }
                        placeholder="Role scope & deliverables"
                        className="w-full border border-line bg-paper px-3 py-1.5 text-[13.5px]"
                      />
                      <input
                        aria-label="Work sample prompt"
                        value={role.workSample}
                        onChange={(e) =>
                          updateCohortRole(idx, { workSample: e.target.value })
                        }
                        placeholder="4-hr work sample prompt shown on expand"
                        className="w-full border border-line bg-paper px-3 py-1.5 text-[13px] text-ink-2"
                      />
                    </div>
                  ))}
                </div>
              </form>
            </div>
          )}

          {/* ── 03. CANDIDATES ────────────────────────────────────── */}
          {activeTab === 'candidates' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center gap-1">
                  {(['all', ...APPLICATION_STATUSES.map((s) => s.value)] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setCandidateStatusFilter(st)}
                        className={`cursor-pointer whitespace-nowrap px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] ${
                          candidateStatusFilter === st
                            ? 'bg-ink text-field'
                            : 'text-ink-2 hover:bg-field hover:text-ink'
                        }`}
                      >
                        {st}
                      </button>
                    ),
                  )}
                </div>
                <input
                  type="search"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search name, role, or reference…"
                  className="w-full border border-line bg-field px-3 py-1.5 text-[13.5px] sm:w-64"
                />
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <div className="overflow-x-auto border border-line bg-paper">
                  {filteredCandidates.length === 0 ? (
                    <p className="p-6 text-[14.5px] text-ink-2">
                      No matching candidate submissions yet.
                    </p>
                  ) : (
                    <table className="w-full border-collapse text-left text-[13.5px]">
                      <thead>
                        <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
                          <th className="px-4 py-3 font-normal">Candidate</th>
                          <th className="px-4 py-3 font-normal">Role</th>
                          <th className="px-4 py-3 font-normal">Stage</th>
                          <th className="px-4 py-3 text-right font-normal">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {filteredCandidates.map((cand) => {
                          const active = selectedCandidate?.id === cand.id;
                          return (
                            <tr
                              key={cand.id}
                              onClick={() => {
                                setSelectedCandidateId(cand.id);
                                setReviewerDraft(cand.reviewerNotes || '');
                              }}
                              className={`cursor-pointer transition-colors ${
                                active ? 'bg-field' : 'hover:bg-field/60'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-ink">
                                  {cand.name}
                                </p>
                                <p className="font-mono text-[11px] text-ink-3">
                                  {cand.id}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-ink-2">
                                {cand.role}
                              </td>
                              <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-accent">
                                {cand.status}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-[11.5px] tabular-nums text-ink-3">
                                {formatDateShort(cand.submittedAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="border border-line bg-paper p-6">
                  {!selectedCandidate ? (
                    <p className="text-[14px] text-ink-3">
                      Select an application row to inspect details and record
                      review notes.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                            {selectedCandidate.id}
                          </p>
                          <h2 className="mt-1 text-[1.25rem] font-medium text-ink">
                            {selectedCandidate.name}
                          </h2>
                          <p className="text-[13.5px] text-ink-2">
                            {selectedCandidate.role}
                          </p>
                        </div>

                        <select
                          aria-label="Candidate review status"
                          value={selectedCandidate.status}
                          disabled={savingCandidate}
                          onChange={(e) =>
                            handleUpdateCandidate(selectedCandidate.id, {
                              status: e.target.value as ApplicationStatus,
                            })
                          }
                          className="border border-line bg-field px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink"
                        >
                          {APPLICATION_STATUSES.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <dl className="space-y-2 text-[13.5px]">
                        <div>
                          <dt className="label">Email</dt>
                          <dd className="mt-0.5">
                            <a
                              href={`mailto:${selectedCandidate.email}`}
                              className="text-ink underline underline-offset-4 hover:text-accent"
                            >
                              {selectedCandidate.email}
                            </a>
                          </dd>
                        </div>
                        <div>
                          <dt className="label">Portfolio / Work</dt>
                          <dd className="mt-0.5 break-all">
                            {selectedCandidate.portfolioUrl ? (
                              <a
                                href={selectedCandidate.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-ink underline underline-offset-4 hover:text-accent"
                              >
                                {selectedCandidate.portfolioUrl} ↗
                              </a>
                            ) : (
                              <span className="text-ink-3">Not provided</span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      <div className="border-t border-line pt-3">
                        <Label>Applicant Note</Label>
                        <p className="mt-2 whitespace-pre-wrap text-[14px] leading-[1.65] text-ink">
                          {selectedCandidate.note}
                        </p>
                      </div>

                      <div className="border-t border-line pt-3">
                        <label
                          htmlFor="reviewer-notes"
                          className="label mb-1.5 block"
                        >
                          Internal Review Notes
                        </label>
                        <textarea
                          id="reviewer-notes"
                          rows={3}
                          value={reviewerDraft}
                          onChange={(e) => setReviewerDraft(e.target.value)}
                          placeholder="Call impressions, work-sample evaluation..."
                          className="w-full border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                        />
                        <button
                          type="button"
                          disabled={savingCandidate}
                          onClick={() =>
                            handleUpdateCandidate(selectedCandidate.id, {
                              reviewerNotes: reviewerDraft,
                            })
                          }
                          className="mt-2.5 cursor-pointer border border-ink bg-ink px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-field hover:border-accent hover:bg-accent"
                        >
                          Save note
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 04. DESK (TEAMWORK & INTERNAL OPERATIONS) ─────────── */}
          {activeTab === 'desk' && (
            <div className="space-y-5">
              <form
                onSubmit={handleCreateDeskItem}
                className="grid gap-3 border border-line bg-paper p-4 lg:grid-cols-[minmax(0,1.5fr)_9rem_10rem_9.5rem_auto]"
              >
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add action item (e.g. Test thermal 50x25mm print alignment)…"
                  className="border border-line bg-field px-3 py-2 text-[14px] text-ink"
                />
                <select
                  aria-label="Stream"
                  value={newTaskStream}
                  onChange={(e) =>
                    setNewTaskStream(e.target.value as StudioStream)
                  }
                  className="border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                >
                  {STUDIO_ITEM_STREAMS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  placeholder="Assignee"
                  className="border border-line bg-field px-3 py-2 text-[13.5px] text-ink"
                />
                <input
                  type="date"
                  aria-label="Due date"
                  value={newTaskDue}
                  onChange={(e) => setNewTaskDue(e.target.value)}
                  className="border border-line bg-field px-3 py-2 font-mono text-[12px] text-ink"
                />
                <button
                  type="submit"
                  disabled={savingDesk}
                  className="cursor-pointer whitespace-nowrap border border-ink bg-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-field hover:border-accent hover:bg-accent disabled:opacity-60"
                >
                  {savingDesk ? 'Adding…' : 'Add to Desk'}
                </button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1">
                  {(['all', ...STUDIO_ITEM_STREAMS] as const).map((stream) => (
                    <button
                      key={stream}
                      type="button"
                      onClick={() => setDeskStreamFilter(stream)}
                      className={`cursor-pointer whitespace-nowrap px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] ${
                        deskStreamFilter === stream
                          ? 'bg-ink text-field'
                          : 'text-ink-2 hover:bg-paper hover:text-ink'
                      }`}
                    >
                      {stream === 'all' ? 'All streams' : stream}
                    </button>
                  ))}
                </div>
                <input
                  type="search"
                  value={deskSearch}
                  onChange={(e) => setDeskSearch(e.target.value)}
                  placeholder="Filter tasks or owner…"
                  className="w-full border border-line bg-paper px-3 py-1.5 text-[13.5px] sm:w-64"
                />
              </div>

              <div className="overflow-x-auto border border-line bg-paper">
                {filteredDesk.length === 0 ? (
                  <p className="p-6 text-[14.5px] text-ink-2">
                    Desk is clear. Log an action item above across Sikka,
                    Research, Cohort Ops, or Studio.
                  </p>
                ) : (
                  <table className="w-full border-collapse text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b border-line font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
                        <th className="px-4 py-3 font-normal">Stream</th>
                        <th className="px-4 py-3 font-normal">Action Item</th>
                        <th className="px-4 py-3 font-normal">Owner</th>
                        <th className="px-4 py-3 font-normal">Due</th>
                        <th className="px-4 py-3 font-normal">State</th>
                        <th className="px-4 py-3 text-right font-normal">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {filteredDesk.map((item) => (
                        <tr key={item.id} className="hover:bg-field/50">
                          <td className="px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-accent">
                            {item.stream}
                          </td>
                          <td className="px-4 py-3 font-medium text-ink">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-ink-2">
                            {item.assigneeName || 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-ink-3">
                            {item.dueDate || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              aria-label={`Status for ${item.title}`}
                              value={item.status}
                              onChange={(e) =>
                                handleUpdateDeskStatus(
                                  item.id,
                                  e.target.value as StudioItemStatus,
                                )
                              }
                              className="border border-line bg-field px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink"
                            >
                              {STUDIO_ITEM_STATUSES.map((st) => (
                                <option key={st.value} value={st.value}>
                                  {st.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteDeskItem(item.id)}
                              className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3 hover:text-accent"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
