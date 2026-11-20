export type ReplyDecision = 'shortlisted' | 'not_selected';

export type InternshipTrackKey =
  | 'research'
  | 'design_build'
  | 'growth_distribution'
  | 'general';

export interface CandidateReplyInput {
  referenceId: string;
  name: string;
  email: string;
  role: string;
  portfolioUrl?: string;
  note?: string;
}

export interface GeneratedCandidateReply {
  track: InternshipTrackKey;
  trackLabel: string;
  decision: ReplyDecision;
  subject: string;
  body: string;
}

interface TrackGuidance {
  label: string;
  weekOneIdeas: readonly [string, string, string];
}

const TRACK_GUIDANCE: Record<InternshipTrackKey, TrackGuidance> = {
  research: {
    label: 'Research',
    weekOneIdeas: [
      'Observe 3 to 5 local retail counters (apparel, footwear, or neighbourhood stores) and note where paper books, spreadsheets, or billing screens slow operators down during rush hours.',
      'Put together a teardown of two counter or bookkeeping tools shop owners already try, focusing on friction during billing setup or end-of-day cash tallying.',
      'Write a short field note isolating one concrete workflow constraint worth testing or building around.',
    ],
  },
  design_build: {
    label: 'Design & build',
    weekOneIdeas: [
      'Test parchi. (https://parchi-pos.vercel.app/) on desktop and mobile as a store operator and note dense flows, keyboard friction, or offline edge cases to simplify.',
      'Look closely at thermal receipt (80mm), barcode hangtag (50×25mm / 24-up A4), or local JSON/CSV export flows for one reliability or ergonomics improvement.',
      'Sketch or prototype one focused, fast counter interface or local-first utility that solves a single recurring store task cleanly.',
    ],
  },
  growth_distribution: {
    label: 'Growth & distribution',
    weekOneIdeas: [
      'Speak with 5 independent retail or apparel shopkeepers to map how they currently choose billing tools and what objections keep them on paper or spreadsheets.',
      'Test plain-language positioning and onboarding copy for parchi. (https://parchi-pos.vercel.app/) that explains the value in 30 seconds without a sales demo.',
      'Outline a practical five-shop field pilot covering onboarding steps, counter setup checks, and realistic pricing feedback.',
    ],
  },
  general: {
    label: 'Studio Cohort',
    weekOneIdeas: [
      'Walk through parchi. (https://parchi-pos.vercel.app/) and our recent notes to see where your background overlaps most with active retail workflows.',
      'Document one concrete product, workflow, or distribution gap you notice from real small-business usage.',
      'Scope a small, self-contained deliverable you can finish and share by the end of week one.',
    ],
  },
};

export function resolveInternshipTrack(roleTitle: string): InternshipTrackKey {
  const normalized = roleTitle.trim().toLowerCase();
  if (!normalized) return 'general';
  if (normalized.includes('research')) return 'research';
  if (
    normalized.includes('design') ||
    normalized.includes('build') ||
    normalized.includes('engineer') ||
    normalized.includes('front')
  ) {
    return 'design_build';
  }
  if (
    normalized.includes('growth') ||
    normalized.includes('distribution') ||
    normalized.includes('marketing') ||
    normalized.includes('outreach')
  ) {
    return 'growth_distribution';
  }
  return 'general';
}

function firstNameOf(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return 'there';
  return trimmed.split(/\s+/)[0] || 'there';
}

function summarizeNoteSnippet(note: string, maxLength = 140): string {
  const clean = note.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  const sliced = clean.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function buildWorkHighlightSentence(candidate: CandidateReplyInput): string {
  const url = (candidate.portfolioUrl || '').trim();
  const snippet = summarizeNoteSnippet(candidate.note || '');

  if (url && snippet) {
    return `We went through the work you shared (${url}) along with your note ("${snippet}"), and it stood out.`;
  }
  if (url) {
    return `We went through the work you shared (${url}) and your application note, and your work stood out.`;
  }
  if (snippet) {
    return `We read through what you shared in your application ("${snippet}"), and your background stood out.`;
  }
  return 'We read through what you shared about your background and previous work, and it stood out.';
}

export function buildCandidateReplyTemplate(
  candidate: CandidateReplyInput,
  decision: ReplyDecision,
): GeneratedCandidateReply {
  const track = resolveInternshipTrack(candidate.role);
  const guidance = TRACK_GUIDANCE[track];
  const roleDisplay = candidate.role.trim() || guidance.label;
  const firstName = firstNameOf(candidate.name);
  const ref = candidate.referenceId.trim();
  const refSuffix = ref ? ` (${ref})` : '';

  if (decision === 'not_selected') {
    const workAck = (candidate.portfolioUrl || '').trim()
      ? `Thank you for applying for the ${roleDisplay} track at Diwan Mercantile and sharing your work (${candidate.portfolioUrl!.trim()}).`
      : `Thank you for applying for the ${roleDisplay} track at Diwan Mercantile and taking the time to write in.`;

    const subject = `Diwan Mercantile Cohort 2026–27 · ${roleDisplay}${refSuffix}`;
    const body = [
      `Hi ${firstName},`,
      '',
      workAck,
      '',
      'Because we keep each cohort very small (2–4 people), we are unable to offer you a spot in this round. We genuinely appreciate the work you shared and will keep your application on file if a closer opening comes up in a future cycle.',
      '',
      'Wishing you the very best with what you build next.',
      '',
      'Best,',
      'Harsh',
      'Diwan Mercantile',
    ].join('\n');

    return {
      track,
      trackLabel: guidance.label,
      decision,
      subject,
      body,
    };
  }

  const workHighlight = buildWorkHighlightSentence(candidate);
  const subject = `Cohort 2026–27 · ${roleDisplay} — Next steps${refSuffix}`;
  const body = [
    `Hi ${firstName},`,
    '',
    `Thanks for applying for the ${roleDisplay} track at Diwan Mercantile.`,
    '',
    `${workHighlight} Based on what you have already done, we would like to shortlist you for Cohort 2026–27.`,
    '',
    'Here are a few concrete things you could look into during your first week:',
    `- ${guidance.weekOneIdeas[0]}`,
    `- ${guidance.weekOneIdeas[1]}`,
    `- ${guidance.weekOneIdeas[2]}`,
    '',
    'As a quick reminder, the cohort runs 8–12 weeks part-time (10–25 hrs/week, remote or Bengaluru) and is unpaid, finishing with published co-authored work, a certificate, and a letter of recommendation.',
    '',
    'Reply to this email and propose what you would like to take on as your first contribution—either one of the areas above or another angle you think is more valuable—along with when you can start.',
    '',
    'Best,',
    'Harsh',
    'Diwan Mercantile',
  ].join('\n');

  return {
    track,
    trackLabel: guidance.label,
    decision,
    subject,
    body,
  };
}

export function buildCandidateMailtoHref(params: {
  to: string;
  subject: string;
  body: string;
}): string {
  const email = params.to.trim();
  const query = `subject=${encodeURIComponent(params.subject)}&body=${encodeURIComponent(params.body)}`;
  return `mailto:${email}?${query}`;
}
