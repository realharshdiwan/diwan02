import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE,
  REGISTRATION,
  NAV,
  STUDIO_PILLARS,
  STUDIO_FAQ,
  CAREERS_FAQ,
  RESEARCH_STUDIES,
  RESEARCH_POSTS,
  RESEARCH_OPEN_QUESTIONS,
  DEFAULT_COHORTS,
  DEFAULT_VENTURES,
  PARCHI_PRODUCT,
  INTERNSHIP_PROGRAMME,
  INTERNSHIP_ROLES,
  HERO_MASCOT,
  THEME_TOKENS,
  normalizeRoute,
  parseRoute,
  validateApplication,
  buildApplicationMailto,
  resolveMascotRenderMode,
  contrastRatio,
} from './site';

test('hero statement, navigation, address, FAQs, ventures, and product-free Research notes align with site structure', () => {
  const lower = SITE.heroStatement.toLowerCase();
  assert.ok(lower.includes('markets'));
  assert.ok(lower.includes('businesses'));
  assert.ok(lower.includes('products'));
  assert.ok(!lower.includes('in bengaluru'));
  assert.ok(!lower.includes('currently operating sikka'));
  assert.equal(REGISTRATION.locality, 'Ramesh Nagar, Bengaluru 560082');
  assert.equal(STUDIO_PILLARS.length, 3);
  assert.ok(STUDIO_FAQ.length >= 3);
  assert.ok(STUDIO_FAQ[0].a.toLowerCase().includes('compelling'));
  assert.ok(!STUDIO_FAQ[0].a.toLowerCase().includes('do not take on'));
  assert.ok(CAREERS_FAQ.length >= 3);
  assert.ok(DEFAULT_VENTURES.length >= 1);
  assert.equal(DEFAULT_VENTURES[0].name, 'parchi.');

  assert.equal(RESEARCH_STUDIES.length, 0);
  assert.equal(RESEARCH_POSTS.length, 0);
  assert.equal(RESEARCH_OPEN_QUESTIONS.length, 0);

  assert.deepEqual(
    NAV.map((item) => item.label),
    ['Product', 'Research', 'Careers', 'Contact'],
  );
  assert.equal(PARCHI_PRODUCT.url, 'https://parchi-pos.vercel.app/');
});

test('internship cohort lists concise terms, concrete FAQ, and 3 open roles', () => {
  assert.equal(INTERNSHIP_PROGRAMME.terms.length, 3);
  assert.equal(CAREERS_FAQ.length, 3);
  assert.equal(DEFAULT_COHORTS[0].roles.length, 3);
  assert.equal(
    INTERNSHIP_ROLES[0].focus,
    'Visits, operator interviews, and competitor teardowns.',
  );
  const termsText = INTERNSHIP_PROGRAMME.terms.map((t) => t.value).join(' ').toLowerCase();
  assert.ok(!termsText.includes('jan'));
  assert.ok(!termsText.includes('jul'));
  assert.ok(!termsText.includes('intake'));
  assert.deepEqual(
    INTERNSHIP_ROLES.map((r) => r.title),
    ['Research', 'Design & build', 'Growth & distribution'],
  );
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
    role: 'Product Research Intern',
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
    role: 'Product Research Intern',
    portfolioUrl: 'https://github.com/asha',
    note: 'Researched kirana inventory leakage across three Bengaluru neighbourhood stores.',
  };
  const valid = validateApplication(validInput);
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});

  const mailto = buildApplicationMailto(validInput);
  assert.ok(mailto.startsWith(`mailto:${SITE.contactEmail}?subject=`));
  assert.ok(mailto.includes('Product%20Research%20Intern'));
});

test('route normalization resolves /, /research, /research/:slug, /careers, and /studio cleanly', () => {
  assert.equal(normalizeRoute('/'), '/');
  assert.equal(normalizeRoute('/research'), '/research');
  assert.equal(normalizeRoute('/research/some-post'), '/research');
  assert.deepEqual(parseRoute('/research/some-post'), {
    route: '/research',
    researchSlug: 'some-post',
  });
  assert.equal(normalizeRoute('/careers'), '/careers');
  assert.equal(normalizeRoute('/studio'), '/studio');
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
