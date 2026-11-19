export type AppRoute = '/' | '/research' | '/careers';
export type HeroLayout = 1 | 2;

export interface NavItem {
  label: string;
  href: string;
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
  commitment: string;
  stipend: string;
}

export interface VentureStep {
  step: string;
  title: string;
  detail: string;
}

export interface ApplicationInput {
  name: string;
  email: string;
  role: string;
  portfolioUrl: string;
  note: string;
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
    'An independent research studio. We study how a business actually runs, then build the software and ventures that follow.',
  description:
    'Diwan Mercantile is an independent research studio in Bengaluru. We study how businesses run, then build the software and ventures that follow.',
  url: 'https://www.diwanmercantile.in',
  contactEmail: 'diwanmercantileindia@gmail.com',
  basedIn: 'Bengaluru, Karnataka',
  year: 2026,
} as const;

export interface StudioPillar {
  n: string;
  title: string;
  body: string;
}

export const STUDIO_PILLARS: readonly StudioPillar[] = [
  {
    n: '01',
    title: 'Research',
    body: 'Field studies of how a market actually operates: the counter, the stockroom, the ledger, and the places software is assumed to help but does not.',
  },
  {
    n: '02',
    title: 'Ventures',
    body: 'Where the research points at a gap, we build the product ourselves and run it. Sikka is the first.',
  },
  {
    n: '03',
    title: 'Software',
    body: 'Web systems, internal tools, and automation — for the ventures, and for the businesses the research is about.',
  },
] as const;

/**
 * Optional custom mascot asset path (e.g. '/mascot.png' or '/mascot.svg').
 * Leave empty to display the built-in decorated Marwari horse vector mascot.
 */
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
  { label: 'Ventures', href: '/#ventures' },
  { label: 'Research', href: '/research' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/#contact' },
];

export const RESEARCH_STUDIES: readonly ResearchStudy[] = [
  {
    n: '01',
    date: '2026',
    readTime: '4 min read',
    title:
      'Why shop-floor billing software stalls during peak evening retail hours',
    sector: 'Indian apparel, footwear & small retail',
    dek: 'After studying counter workflows, stock ledgers, and label printing across independent retail stores, a clear pattern emerges: most counter bottlenecks are caused by connectivity and catalogue assumptions rather than hardware speed.',
    paragraphs: [
      'Most browser-based billing tools assume uninterrupted broadband at the cash desk. On real shop floors, Wi-Fi and mobile hotspots drop precisely during peak evening footfall between 6 PM and 9 PM. When checkout waits on a cloud round-trip, staff revert to paper slips and reconcile discrepancies manually after closing.',
      'Catalogue structure creates the second point of friction. Apparel and footwear counters buy, price, and reorder in size-by-colour matrices—not isolated flat SKU rows. Forcing staff to maintain dozens of detached line items slows billing and guarantees stock drift within the first month.',
      'Print workflows reveal the third gap. Independent stores run on compact 80mm thermal receipt rolls, 50×25mm barcode hangtag rolls, or 24-up A4 sticker sheets while reconciling UPI confirmations alongside optional GSTIN invoices. Any system that bolts thermal geometry on as an afterthought introduces daily manual re-entry.',
    ],
    studioInput:
      'Our input after analysis: trustworthy retail counter tools must store every state locally first with clean JSON/CSV portability, treat variant matrices as a primary primitive, and respect native thermal print widths out of the box.',
  },
];

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

export const INTERNSHIP_PROGRAMME = {
  eyebrow: 'Careers',
  headline: 'A small cohort, working on one real question.',
  intro: [
    'Diwan Mercantile runs a cohort of two to four people alongside the studio. You take one question — how a market works, why a tool fails at the counter — and work it through shop visits, operator interviews, teardowns, and a written note.',
    'It runs for 8–12 weeks, part-time, and is unpaid. We work remotely, with field visits in Bengaluru where the question needs them.',
  ],
  /** Optional external Google Form URL; leave empty to use built-in POST /api/apply form. */
  googleFormUrl: '',
  terms: [
    { label: 'Length', value: '8–12 weeks' },
    { label: 'Commitment', value: '10–20 hours a week' },
    { label: 'Stipend', value: 'Unpaid' },
    { label: 'Location', value: 'Remote; Bengaluru for field work' },
  ],
  venturePath: [
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
        'Shop visits, operator interviews, competitor teardowns, and a prototype where it helps.',
    },
    {
      step: '03',
      title: 'Publish',
      detail:
        'Write the field note, present what changed, and get credited as co-author.',
    },
  ] as readonly VentureStep[],
  ventureNote:
    'Where a project becomes a venture, terms are agreed in writing before work continues. Nothing is promised in advance.',
  outcomes: [
    'A published field note with your name on it.',
    'A prototype or a shipped change inside a real product.',
    'A written reference when the cohort ends.',
  ],
} as const;

export const INTERNSHIP_ROLES: readonly InternshipRole[] = [
  {
    id: 'research',
    number: '01',
    title: 'Research Intern',
    focus:
      'Shop visits, operator interviews, competitor teardowns, and the written note.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'design-engineering',
    number: '02',
    title: 'Design & Engineering Intern',
    focus:
      "Interface flows, prototypes, and front-end work on the studio's tools.",
    commitment: '15–25 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'growth-distribution',
    number: '03',
    title: 'Growth & Distribution Intern',
    focus:
      'Merchant outreach, onboarding, pricing tests, and distribution experiments.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
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

export function normalizeRoute(pathname: string): AppRoute {
  if (pathname.startsWith('/careers')) return '/careers';
  if (pathname.startsWith('/research')) return '/research';
  return '/';
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
