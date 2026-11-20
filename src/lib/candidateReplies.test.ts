import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCandidateMailtoHref,
  buildCandidateReplyTemplate,
  resolveInternshipTrack,
} from './candidateReplies.ts';

test('resolveInternshipTrack maps all 3 internship categories and aliases accurately', () => {
  assert.equal(resolveInternshipTrack('Research'), 'research');
  assert.equal(resolveInternshipTrack('Product Research Intern'), 'research');
  assert.equal(resolveInternshipTrack('Design & build'), 'design_build');
  assert.equal(resolveInternshipTrack('Front-end Engineering'), 'design_build');
  assert.equal(resolveInternshipTrack('Growth & distribution'), 'growth_distribution');
  assert.equal(resolveInternshipTrack('Merchant Outreach'), 'growth_distribution');
  assert.equal(resolveInternshipTrack('Operations'), 'general');
});

test('shortlisted template highlights candidate work, lists Week 1 areas, invites contribution proposal, and skips call mentions', () => {
  const roles = ['Research', 'Design & build', 'Growth & distribution'] as const;

  for (const role of roles) {
    const reply = buildCandidateReplyTemplate(
      {
        referenceId: 'DM-20261120-7K2M',
        name: 'Ananya Verma',
        email: 'ananya@example.com',
        role,
        portfolioUrl: 'https://github.com/ananya/store-notes',
        note: 'Documented checkout bottlenecks across four garment shops in Indiranagar.',
      },
      'shortlisted',
    );

    assert.ok(reply.subject.includes(role));
    assert.ok(reply.subject.includes('DM-20261120-7K2M'));
    assert.ok(reply.body.includes('Hi Ananya,'));
    assert.ok(reply.body.includes('https://github.com/ananya/store-notes'));
    assert.ok(reply.body.includes('Indiranagar'));
    assert.ok(reply.body.includes('first contribution'));
    assert.ok(!/\bcall\b/i.test(reply.body));
    assert.ok(!/\bcall\b/i.test(reply.subject));
    assert.ok(!reply.body.toLowerCase().includes('work sample'));
    assert.equal(
      reply.body.split('\n').filter((line) => line.startsWith('- ')).length,
      3,
    );
  }
});

test('thank-you template produces role-specific polite pass and builds safe mailto URL', () => {
  const reply = buildCandidateReplyTemplate(
    {
      referenceId: 'DM-20261120-9Q1P',
      name: 'Rohan Nair',
      email: 'rohan@example.com',
      role: 'Design & build',
      portfolioUrl: 'https://rohan.dev',
    },
    'not_selected',
  );

  assert.ok(reply.subject.includes('Design & build'));
  assert.ok(reply.body.includes('Hi Rohan,'));
  assert.ok(reply.body.includes('Thank you for applying for the Design & build track'));
  assert.ok(reply.body.includes('https://rohan.dev'));

  const href = buildCandidateMailtoHref({
    to: 'rohan@example.com',
    subject: reply.subject,
    body: reply.body,
  });
  assert.ok(href.startsWith('mailto:rohan@example.com?subject='));
  assert.ok(href.includes('&body='));
});
