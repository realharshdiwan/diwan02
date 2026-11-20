import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RESEND_FROM,
  buildApplicantConfirmationPayload,
  buildCandidateReplyPayload,
  buildStudioNotificationPayload,
  escapeHtml,
  isCustomResendDomain,
  resolveResendConfig,
} from './resendEmail.ts';

test('escapeHtml neutralizes HTML tags and quotes cleanly', () => {
  assert.equal(
    escapeHtml('<script>"alert" & \'test\'</script>'),
    '&lt;script&gt;&quot;alert&quot; &amp; &#39;test&#39;&lt;/script&gt;',
  );
});

test('resolveResendConfig detects custom sender domain vs resend.dev sandbox', () => {
  const sandbox = resolveResendConfig(
    { RESEND_API_KEY: 're_test_123' },
    'diwanmercantileindia@gmail.com',
  );
  assert.equal(sandbox.apiKey, 're_test_123');
  assert.equal(sandbox.from, DEFAULT_RESEND_FROM);
  assert.equal(sandbox.notifyEmail, 'diwanmercantileindia@gmail.com');
  assert.equal(sandbox.customDomain, false);
  assert.equal(isCustomResendDomain(DEFAULT_RESEND_FROM), false);

  const custom = resolveResendConfig(
    {
      RESEND_API_KEY: 're_live_456',
      RESEND_FROM_EMAIL: 'Diwan Mercantile <careers@diwanmercantile.in>',
      APPLICATION_NOTIFY_EMAIL: 'founders@diwanmercantile.in',
    },
    'diwanmercantileindia@gmail.com',
  );
  assert.equal(custom.customDomain, true);
  assert.equal(custom.from, 'Diwan Mercantile <careers@diwanmercantile.in>');
  assert.equal(custom.notifyEmail, 'founders@diwanmercantile.in');
});

test('studio notification and applicant confirmation payloads sanitize user text', () => {
  const record = {
    id: 'DM-20261118-ABCD',
    submittedAt: '2026-11-18T12:00:00.000Z',
    name: 'Asha <script>Rao',
    email: 'asha@example.com',
    role: 'Product Research Intern',
    portfolioUrl: 'https://github.com/asha',
    note: 'Mapped counter drops.\nMeasured print latency.',
  };

  const studio = buildStudioNotificationPayload(record, {
    from: DEFAULT_RESEND_FROM,
    to: 'diwanmercantileindia@gmail.com',
  });
  assert.equal(studio.replyTo, 'asha@example.com');
  assert.deepEqual(studio.to, ['diwanmercantileindia@gmail.com']);
  assert.ok(studio.subject.includes('DM-20261118-ABCD'));
  assert.ok(studio.html.includes('Asha &lt;script&gt;Rao'));
  assert.ok(!studio.html.includes('<script>Rao'));
  assert.ok(studio.html.includes('<br />'));

  const applicant = buildApplicantConfirmationPayload(record, {
    from: 'Diwan Mercantile <careers@diwanmercantile.in>',
    replyTo: 'diwanmercantileindia@gmail.com',
  });
  assert.deepEqual(applicant.to, ['asha@example.com']);
  assert.equal(applicant.replyTo, 'diwanmercantileindia@gmail.com');
  assert.ok(applicant.text.includes('DM-20261118-ABCD'));
  assert.ok(!applicant.text.toLowerCase().includes('20-minute call'));

  const reply = buildCandidateReplyPayload({
    to: 'asha@example.com',
    referenceId: 'DM-20261118-ABCD',
    subject: 'Cohort 2026–27 · Research — Next steps',
    body: 'Hi Asha,\n\nLook into:\n- Observe <3> counters\n- Write one field note',
    from: 'Diwan Mercantile <careers@diwanmercantile.in>',
    replyTo: 'diwanmercantileindia@gmail.com',
  });
  assert.deepEqual(reply.to, ['asha@example.com']);
  assert.equal(reply.replyTo, 'diwanmercantileindia@gmail.com');
  assert.ok(reply.html.includes('<ul'));
  assert.ok(reply.html.includes('Observe &lt;3&gt; counters'));
  assert.ok(!reply.html.includes('<3>'));
});
