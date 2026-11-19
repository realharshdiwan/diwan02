export type AppRoute = '/' | '/research' | '/careers' | '/studio';
export type HeroLayout = 1 | 2;

export interface ParsedRoute {
  route: AppRoute;
  researchSlug?: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface StudioPillar {
  n: string;
  title: string;
  body: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export type VentureStatus = 'live' | 'building' | 'research' | 'archived';

export interface VentureRecord {
  id: string;
  slug: string;
  name: string;
  stageLabel: string;
  headline: string;
  summary: string;
  url: string;
  ctaLabel: string;
  imageSrc: string;
  imageAlt: string;
  highlights: readonly string[];
  status: VentureStatus;
  featured: boolean;
  sortOrder: number;
  published: boolean;
}

export type ResearchKind = 'note' | 'essay' | 'link';
export type PostStatus = 'draft' | 'published';

export interface ResearchPost {
  id: string;
  slug: string;
  title: string;
  dek: string;
  bodyMd: string;
  kind: ResearchKind;
  basis: string;
  tags: readonly string[];
  sourceUrl: string;
  sourceLabel: string;
  status: PostStatus;
  readingMinutes: number;
  publishedAt: string;
}

export interface ResearchStudy {
  n: string;
  date: string;
  readTime: string;
  title: string;
  sector: string;
  dek: string;
  paragraphs: readonly string[];
  studioInput: string;
}

export interface InternshipRole {
  id: string;
  number: string;
  title: string;
  focus: string;
  workSample: string;
  commitment: string;
  stipend: string;
}

export interface CohortTerm {
  label: string;
  value: string;
}

export interface CohortRecord {
  id: string;
  slug: string;
  title: string;
  windowLabel: string;
  summary: string;
  terms: readonly CohortTerm[];
  roles: readonly InternshipRole[];
  status: 'open' | 'upcoming' | 'closed';
}

export interface VentureStep {
  step: string;
  title: string;
  detail: string;
}

export type ApplicationStatus = 'new' | 'shortlisted' | 'reviewed' | 'archived';

export interface ApplicationInput {
  name: string;
  email: string;
  role: string;
  portfolioUrl: string;
  note: string;
  cohortSlug?: string;
}

export interface ApplicationRecord extends ApplicationInput {
  id: string;
  submittedAt: string;
  status: ApplicationStatus;
  reviewerNotes: string;
  emailDispatched: boolean;
}

export type StudioStream = 'Sikka' | 'Research' | 'Cohort Ops' | 'Studio';
export type StudioItemStatus = 'queued' | 'in_motion' | 'in_review' | 'settled';

export interface StudioItem {
  id: string;
  stream: StudioStream;
  title: string;
  status: StudioItemStatus;
  assigneeName: string;
  assigneeEmail: string;
  dueDate: string;
  notes: string;
  updatedAt: string;
}

export interface MascotConfig {
  imageSrc: string;
  alt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ApplicationInput, string>>;
}

export const SITE = {
  name: 'Diwan Mercantile',
  heroStatement:
    'Diwan Mercantile researches markets, evaluates businesses, and builds software products.',
  url: 'https://www.diwanmercantile.in',
  contactEmail: 'diwanmercantileindia@gmail.com',
  basedIn: 'Bengaluru, Karnataka',
  year: 2026,
} as const;

export const HERO_MASCOT: MascotConfig = {
  imageSrc: '/marwari-horse-mascot.png',
  alt: 'Ancient decorated Marwari horse mascot in espresso ink and red-oxide terracotta ceremonial tack',
};

/** Publishable identifiers only. Never PAN, bank, mobile, or address. */
export const REGISTRATION = {
  enterpriseType: 'Micro enterprise',
  gstin: '29KBKPD1056A1ZW',
  udyam: 'UDYAM-KR-03-0729192',
  locality: 'Ramesh Nagar, Bengaluru 560082',
} as const;

export const NAV: readonly NavItem[] = [
  { label: 'Product', href: '/#ventures' },
  { label: 'Research', href: '/research' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/#contact' },
];

export const STUDIO_PILLARS: readonly StudioPillar[] = [
  {
    n: '01',
    title: 'Observe workflows',
    body: 'Watch how shops, counters, and small operating teams actually track stock and cash before proposing software.',
  },
  {
    n: '02',
    title: 'Isolate the constraint',
    body: 'Separate genuine operational bottlenecks—unreliable connectivity, thermal print limits, variant matrices—from feature noise.',
  },
  {
    n: '03',
    title: 'Build narrow tools',
    body: 'Ship small, dependable software that keeps state local first, exports cleanly, and earns repeat daily use.',
  },
];

export const STUDIO_FAQ: readonly FaqItem[] = [
  {
    q: 'What does Diwan Mercantile do?',
    a: 'We research how small operating businesses work on the ground and build narrow, dependable software tools from those findings.',
  },
  {
    q: 'How do you choose what to build next?',
    a: 'We start by studying real operational constraints—unreliable Wi-Fi, thermal print limits, cash reconciliation—before committing to software.',
  },
  {
    q: 'Do you take on client or agency work?',
    a: 'No. All research notes and software products are developed in-house as independent ventures.',
  },
  {
    q: 'How are new apps released?',
    a: 'Each app begins as a focused single-workflow tool—such as Sikka for retail counters—and stays simple enough to run locally.',
  },
];

export const CAREERS_FAQ: readonly FaqItem[] = [
  {
    q: 'Is the internship paid or unpaid?',
    a: 'Unpaid. Cohorts run part-time (10–25 hrs/week) over 8–12 weeks; contributors finish with published co-authored work, a certificate, and a letter of recommendation.',
  },
  {
    q: 'What does selection involve?',
    a: 'Submit the form below with proof of work. Shortlisted candidates do a 20-minute call and a 4-hour role-specific work sample.',
  },
  {
    q: 'Can I join remotely or alongside college?',
    a: 'Yes. Work is remote across India or in person in Bengaluru, scheduled asynchronously around existing coursework.',
  },
  {
    q: 'What happens if a project grows into a product?',
    a: 'Where a project continues as a venture or product role, terms are agreed separately in writing before further work begins.',
  },
];

export const RESEARCH_OPEN_QUESTIONS: readonly string[] = [];

export const RESEARCH_POSTS: readonly ResearchPost[] = [];

export const RESEARCH_STUDIES: readonly ResearchStudy[] = [];

export const SIKKA_PRODUCT = {
  name: 'Sikka',
  url: 'https://sikka-pos.vercel.app/#top',
  headline: 'Simple counter billing for busy retail shops.',
  summary:
    'Offline-first point of sale, barcode price tagging, and daily cash reconciliation for Indian apparel, footwear, and retail stores.',
  highlights: [
    'Runs offline on the counter computer with local storage and instant JSON/CSV exports.',
    'Handles size × colour variants, 80mm thermal receipts, UPI QR, and optional GSTIN billing.',
    'Prints Code128 barcode hangtags on 50×25mm thermal rolls and 24-up A4 sheets.',
  ],
  imageSrc: '/sikka-preview.png',
  imageAlt:
    'Sikka point-of-sale web application showing counter billing and thermal receipt workflow',
} as const;

export const VENTURE_STATUSES: readonly {
  value: VentureStatus;
  label: string;
}[] = [
  { value: 'live', label: 'Live' },
  { value: 'building', label: 'In build' },
  { value: 'research', label: 'Research' },
  { value: 'archived', label: 'Archived' },
];

export const DEFAULT_VENTURES: readonly VentureRecord[] = [
  {
    id: 'seed-sikka',
    slug: 'sikka',
    name: SIKKA_PRODUCT.name,
    stageLabel: 'First venture',
    headline: SIKKA_PRODUCT.headline,
    summary: SIKKA_PRODUCT.summary,
    url: SIKKA_PRODUCT.url,
    ctaLabel: 'Open Sikka',
    imageSrc: SIKKA_PRODUCT.imageSrc,
    imageAlt: SIKKA_PRODUCT.imageAlt,
    highlights: SIKKA_PRODUCT.highlights,
    status: 'live',
    featured: true,
    sortOrder: 1,
    published: true,
  },
];

export const INTERNSHIP_PROGRAMME = {
  eyebrow: 'Careers',
  headline: 'Work directly on live research and software builds.',
  intro:
    'Small 2–4 person part-time cohorts working beside founders on open research questions and software builds. Internships are unpaid; contributors finish with published co-authored work, a certificate, and a letter of recommendation.',
  googleFormUrl: '',
  terms: [
    { label: 'Format', value: '8–12 weeks · Unpaid · Certificate & LOR' },
    { label: 'Schedule', value: '10–25 hrs/week · Remote or Bengaluru' },
    { label: 'Selection', value: 'Application → 20-min call → 4-hr work sample' },
  ],
  howItWorks: [
    {
      step: '01',
      title: 'Choose a question',
      detail:
        "Pick one from the studio's open questions, or bring your own with evidence that it matters.",
    },
    {
      step: '02',
      title: 'Work it',
      detail:
        'Visits, operator interviews, competitor teardowns, and a prototype where it helps.',
    },
    {
      step: '03',
      title: 'Publish',
      detail:
        'Write the field note, present what changed, and get credited as co-author.',
    },
  ] as readonly VentureStep[],
} as const;

export const INTERNSHIP_ROLES: readonly InternshipRole[] = [
  {
    id: 'research',
    number: '01',
    title: 'Research',
    focus: 'Visits, operator interviews, and competitor teardowns.',
    workSample: '',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'design-and-build',
    number: '02',
    title: 'Design & build',
    focus: 'Interface flows, prototypes, and front-end work.',
    workSample:
      '4-hr brief: simplify one dense operator screen or build a small local-state web utility with CSV export.',
    commitment: '15–25 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'growth-and-distribution',
    number: '03',
    title: 'Growth & distribution',
    focus: 'Merchant outreach, onboarding, and pricing tests.',
    workSample:
      '4-hr brief: write a plain-language merchant pitch and outline a five-shop field test.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
];

export const DEFAULT_COHORTS: readonly CohortRecord[] = [
  {
    id: 'seed-cohort-2026-27',
    slug: 'cohort-2026-27',
    title: 'Cohort 2026–27',
    windowLabel: 'Rolling · 8–12 weeks',
    summary: INTERNSHIP_PROGRAMME.intro,
    terms: INTERNSHIP_PROGRAMME.terms,
    roles: INTERNSHIP_ROLES,
    status: 'open',
  },
];

export const STUDIO_ITEM_STREAMS: readonly StudioStream[] = [
  'Sikka',
  'Research',
  'Cohort Ops',
  'Studio',
];

export const STUDIO_ITEM_STATUSES: readonly {
  value: StudioItemStatus;
  label: string;
}[] = [
  { value: 'queued', label: 'Queued' },
  { value: 'in_motion', label: 'In Motion' },
  { value: 'in_review', label: 'In Review' },
  { value: 'settled', label: 'Settled' },
];

export const APPLICATION_STATUSES: readonly {
  value: ApplicationStatus;
  label: string;
}[] = [
  { value: 'new', label: 'New' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'archived', label: 'Archived' },
];

export const THEME_TOKENS = {
  field: '#f5f1e8',
  paper: '#fffdf9',
  clay: '#ebe5d8',
  ink: '#1d1915',
  ink2: '#595046',
  ink3: '#665d52',
  line: '#ddd6c8',
  accent: '#b84121',
} as const;

export function parseRoute(pathname: string): ParsedRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === '/studio' || clean.startsWith('/studio/')) {
    return { route: '/studio' };
  }
  if (clean === '/careers' || clean.startsWith('/careers/')) {
    return { route: '/careers' };
  }
  if (clean === '/research') {
    return { route: '/research' };
  }
  if (clean.startsWith('/research/')) {
    const slug = decodeURIComponent(clean.slice('/research/'.length)).trim();
    return slug ? { route: '/research', researchSlug: slug } : { route: '/research' };
  }
  return { route: '/' };
}

export function normalizeRoute(pathname: string): AppRoute {
  return parseRoute(pathname).route;
}

export function validateApplication(input: ApplicationInput): ValidationResult {
  const errors: Partial<Record<keyof ApplicationInput, string>> = {};

  const nameTrimmed = input.name.trim();
  if (!nameTrimmed) {
    errors.name = 'Enter your full name.';
  } else if (nameTrimmed.length > 120) {
    errors.name = 'Name must be under 120 characters.';
  }

  const emailTrimmed = input.email.trim();
  if (
    !emailTrimmed ||
    emailTrimmed.length > 160 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
  ) {
    errors.email = 'Enter a valid email address.';
  }

  if (!input.role.trim()) {
    errors.role = 'Select an open role.';
  }

  const linkTrimmed = input.portfolioUrl.trim();
  if (
    linkTrimmed &&
    (linkTrimmed.length > 300 || !/^https?:\/\/.+\..+/i.test(linkTrimmed))
  ) {
    errors.portfolioUrl = 'Enter a valid URL starting with http:// or https://.';
  }

  const noteTrimmed = input.note.trim();
  if (!noteTrimmed || noteTrimmed.length < 20) {
    errors.note = 'Write at least a couple of sentences (20+ characters).';
  } else if (noteTrimmed.length > 3000) {
    errors.note = 'Note must be under 3,000 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildApplicationMailto(input: ApplicationInput): string {
  const subject = `[Cohort 2026–27 Application] ${input.role} — ${input.name}`;
  const bodyLines = [
    `Name: ${input.name.trim()}`,
    `Email: ${input.email.trim()}`,
    `Role: ${input.role.trim()}`,
    `Work / Portfolio Link: ${input.portfolioUrl.trim() || 'Not provided'}`,
    '',
    'Note:',
    input.note.trim(),
  ];
  return `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
}

function hexToLinear(channelHex: string): number {
  const srgb = parseInt(channelHex, 16) / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = hexToLinear(clean.slice(0, 2));
  const g = hexToLinear(clean.slice(2, 4));
  const b = hexToLinear(clean.slice(4, 6));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function resolveMascotRenderMode(
  imageSrc: string,
  hasError: boolean,
): 'image' | 'vector' {
  if (!hasError && imageSrc.trim().length > 0) {
    return 'image';
  }
  return 'vector';
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = relativeLuminance(foregroundHex);
  const l2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
