import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE,
  REGISTRATION,
  NAV,
  STUDIO_PILLARS,
  RESEARCH_STUDIES,
  SIKKA_PRODUCT,
  INTERNSHIP_PROGRAMME,
  INTERNSHIP_ROLES,
  HERO_MASCOT,
  THEME_TOKENS,
  normalizeRoute,
  validateApplication,
  buildApplicationMailto,
  resolveMascotRenderMode,
  contrastRatio,
} from './site';

test('studio positioning, navigation, address, and product-free Research essays align with site structure', () => {
  const lower = SITE.heroStatement.toLowerCase();
  assert.ok(lower.includes('research studio'));
  assert.ok(lower.includes('business'));
  assert.ok(lower.includes('software'));
  assert.ok(lower.includes('ventures'));
  assert.ok(!lower.includes('in bengaluru'));
  assert.ok(!lower.includes('currently operating sikka'));
  assert.equal(REGISTRATION.locality, 'Ramesh Nagar, Bengaluru 560082');

  assert.deepEqual(
    STUDIO_PILLARS.map((pillar) => pillar.title),
    ['Research', 'Ventures', 'Software'],
  );

  assert.ok(RESEARCH_STUDIES.length >= 1);
  assert.ok(RESEARCH_STUDIES[0].paragraphs.length >= 2);
  assert.ok(RESEARCH_STUDIES[0].studioInput.length > 20);
  const researchSerialized = JSON.stringify(RESEARCH_STUDIES).toLowerCase();
  assert.ok(!researchSerialized.includes('sikka'));

  assert.deepEqual(
    NAV.map((item) => item.label),
    ['Ventures', 'Research', 'Careers', 'Contact'],
  );
  assert.equal(SIKKA_PRODUCT.url, 'https://sikka-pos.vercel.app/#top');
});

test('internship cohort lists concise terms, a written venture route, and three unpaid open positions', () => {
  assert.equal(INTERNSHIP_PROGRAMME.terms.length, 4);
  assert.equal(INTERNSHIP_PROGRAMME.venturePath.length, 3);
  assert.equal(INTERNSHIP_PROGRAMME.outcomes.length, 3);
  const termsText = INTERNSHIP_PROGRAMME.terms
    .map((t) => `${t.label} ${t.value}`)
    .join(' ')
    .toLowerCase();
  assert.ok(!termsText.includes('jan'));
  assert.ok(!termsText.includes('jul'));
  assert.ok(!termsText.includes('intake'));
  assert.ok(termsText.includes('unpaid'));
  const intro = INTERNSHIP_PROGRAMME.intro.join(' ').toLowerCase();
  assert.ok(intro.includes('unpaid'));
  assert.ok(INTERNSHIP_PROGRAMME.ventureNote.toLowerCase().includes('in writing'));
  assert.ok(
    INTERNSHIP_PROGRAMME.venturePath.some((s) =>
      s.title.toLowerCase().includes('publish'),
    ),
  );
  assert.deepEqual(
    INTERNSHIP_ROLES.map((r) => r.title),
    [
      'Research Intern',
      'Design & Engineering Intern',
      'Growth & Distribution Intern',
    ],
  );
  assert.ok(INTERNSHIP_ROLES.every((r) => r.stipend === 'Unpaid'));
});

test('application validation catches missing, invalid, or oversized fields including portfolio URL', () => {
  const invalid = validateApplication({
    name: '',
    email: 'not-an-email',
    role: '',
    portfolioUrl: 'not-a-url',
    note: 'too short',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.email);
  assert.ok(invalid.errors.role);
  assert.ok(invalid.errors.portfolioUrl);
  assert.ok(invalid.errors.note);

  const oversized = validateApplication({
    name: 'A'.repeat(121),
    email: 'a@example.com',
    role: 'Research Intern',
    portfolioUrl: 'https://example.com/' + 'a'.repeat(300),
    note: 'x'.repeat(3001),
  });
  assert.equal(oversized.valid, false);
  assert.ok(oversized.errors.name);
  assert.ok(oversized.errors.portfolioUrl);
  assert.ok(oversized.errors.note);

  const validInput = {
    name: 'Asha Rao',
    email: 'asha@example.com',
    role: 'Research Intern',
    portfolioUrl: 'https://github.com/asha',
    note: 'Researched kirana inventory leakage across three Bengaluru neighbourhood stores.',
  };
  const valid = validateApplication(validInput);
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});

  const mailto = buildApplicationMailto(validInput);
  assert.ok(mailto.startsWith(`mailto:${SITE.contactEmail}?subject=`));
  assert.ok(mailto.includes('Research%20Intern'));
});

test('route normalization resolves /, /research, and /careers cleanly', () => {
  assert.equal(normalizeRoute('/'), '/');
  assert.equal(normalizeRoute('/research'), '/research');
  assert.equal(normalizeRoute('/careers'), '/careers');
  assert.equal(normalizeRoute('/unknown'), '/');
});

test('red-oxide terracotta palette meets WCAG AA 4.5:1 contrast on field and paper', () => {
  assert.equal(THEME_TOKENS.field, '#f5f1e8');
  assert.equal(THEME_TOKENS.ink, '#1d1915');
  assert.equal(THEME_TOKENS.accent, '#b84121');

  const textTokens = [
    THEME_TOKENS.ink,
    THEME_TOKENS.ink2,
    THEME_TOKENS.ink3,
    THEME_TOKENS.accent,
  ];
  const surfaces = [THEME_TOKENS.field, THEME_TOKENS.paper];

  for (const surface of surfaces) {
    for (const text of textTokens) {
      const ratio = contrastRatio(text, surface);
      assert.ok(
        ratio >= 4.5,
        `Expected contrast >= 4.5 for ${text} on ${surface}, got ${ratio.toFixed(2)}`,
      );
    }
  }
});

test('hero mascot slot uses decorated Marwari horse illustration and falls back cleanly on error', () => {
  assert.ok(HERO_MASCOT.alt.toLowerCase().includes('marwari horse'));
  assert.ok(HERO_MASCOT.imageSrc.includes('marwari-horse-mascot'));
  assert.equal(resolveMascotRenderMode(HERO_MASCOT.imageSrc, false), 'image');
  assert.equal(resolveMascotRenderMode(HERO_MASCOT.imageSrc, true), 'vector');
  assert.equal(resolveMascotRenderMode('', false), 'vector');
  assert.equal(resolveMascotRenderMode('   ', false), 'vector');
});
