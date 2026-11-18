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
    'Diwan Mercantile researches markets, evaluates businesses, and builds software products.',
  url: 'https://www.diwanmercantile.in',
  contactEmail: 'diwanmercantileindia@gmail.com',
  basedIn: 'Bengaluru, Karnataka',
  year: 2026,
} as const;

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
  { label: 'Product', href: '/#product' },
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
  headline: 'Work directly on live research and software builds.',
  intro:
    'Small 2–4 person part-time cohorts working beside founders on market research and software builds. Internships are unpaid; contributors who originate a thesis and lead execution qualify for a studio partnership or venture share.',
  /** Optional external Google Form URL; leave empty to use built-in POST /api/apply form. */
  googleFormUrl: '',
  terms: [
    { label: 'Format', value: '8–12 weeks · Unpaid · Certificate & LOR' },
    { label: 'Schedule', value: '10–25 hrs/week · Remote or Bengaluru' },
    { label: 'Selection', value: 'Application → 20-min call → 4-hr work sample' },
  ],
  venturePath: [
    {
      step: '01',
      title: 'Originate a thesis',
      detail:
        'Bring a clear market problem or product wedge backed by field research.',
    },
    {
      step: '02',
      title: 'Lead execution',
      detail:
        'Drive design, engineering, or merchant adoption from prototype to live launch.',
    },
    {
      step: '03',
      title: 'Earn venture share',
      detail:
        'Approved builds that reach revenue transition into a formal partner or profit-share stake.',
    },
  ] as readonly VentureStep[],
} as const;

export const INTERNSHIP_ROLES: readonly InternshipRole[] = [
  {
    id: 'product-research',
    number: '01',
    title: 'Product Research Intern',
    focus: 'Sector mapping, field workflows, competitor tear-downs, and problem validation.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'product-strategy',
    number: '02',
    title: 'Product Strategy & Planning Intern',
    focus: 'Venture sizing, unit economics, pricing structure, and release scoping.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'marketing-growth',
    number: '03',
    title: 'Marketing & Growth Intern',
    focus: 'Merchant outreach, distribution tests, positioning, and onboarding guides.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'ui-ux-design',
    number: '04',
    title: 'UI/UX Design Intern',
    focus: 'Interface flows, clear typography, thermal receipt layouts, and usability checks.',
    commitment: '10–20 hrs/wk',
    stipend: 'Unpaid',
  },
  {
    id: 'software-development',
    number: '05',
    title: 'Software Development Intern',
    focus: 'Offline-first web apps, counter interfaces, internal tools, and data exports.',
    commitment: '15–25 hrs/wk',
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
