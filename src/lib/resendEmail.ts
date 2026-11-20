import type { ApplicationInput } from './site.ts';

export interface StoredApplicationRecord extends ApplicationInput {
  id: string;
  submittedAt: string;
}

export const DEFAULT_RESEND_FROM = 'Diwan Mercantile <onboarding@resend.dev>';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function isCustomResendDomain(fromAddress: string): boolean {
  const normalized = fromAddress.trim().toLowerCase();
  if (!normalized) return false;
  return !normalized.includes('@resend.dev');
}

export function resolveResendConfig(
  env: NodeJS.ProcessEnv,
  fallbackNotifyEmail: string,
): {
  apiKey: string;
  from: string;
  notifyEmail: string;
  customDomain: boolean;
} {
  const apiKey = (env.RESEND_API_KEY || '').trim();
  const from = (env.RESEND_FROM_EMAIL || '').trim() || DEFAULT_RESEND_FROM;
  const notifyEmail =
    (env.APPLICATION_NOTIFY_EMAIL || '').trim() || fallbackNotifyEmail;

  return {
    apiKey,
    from,
    notifyEmail,
    customDomain: isCustomResendDomain(from),
  };
}

export function buildStudioNotificationPayload(
  record: StoredApplicationRecord,
  options: { from: string; to: string },
) {
  const safeName = escapeHtml(record.name);
  const safeEmail = escapeHtml(record.email);
  const safeRole = escapeHtml(record.role);
  const safeId = escapeHtml(record.id);
  const safeSubmittedAt = escapeHtml(record.submittedAt);
  const safeNote = escapeHtml(record.note).replaceAll('\n', '<br />');

  const portfolioHtml = record.portfolioUrl
    ? `<a href="${escapeHtml(record.portfolioUrl)}" style="color:#b84121;text-decoration:underline;">${escapeHtml(record.portfolioUrl)}</a>`
    : '<span style="color:#665d52;">Not provided</span>';

  return {
    from: options.from,
    to: [options.to],
    replyTo: record.email,
    subject: `[${record.id}] ${record.role} — ${record.name}`,
    text: [
      `Reference: ${record.id}`,
      `Submitted: ${record.submittedAt}`,
      `Role: ${record.role}`,
      `Name: ${record.name}`,
      `Email: ${record.email}`,
      `Work link: ${record.portfolioUrl || 'Not provided'}`,
      '',
      'Note:',
      record.note,
    ].join('\n'),
    html: `
      <div style="background:#f5f1e8;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1d1915;">
        <div style="max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #ddd6c8;padding:28px;">
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#b84121;">
            Cohort Application · ${safeId}
          </p>
          <h1 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#1d1915;">
            ${safeName} — ${safeRole}
          </h1>
          <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;">
            <tr>
              <td style="padding:6px 12px 6px 0;color:#665d52;width:110px;vertical-align:top;">Email</td>
              <td style="padding:6px 0;"><a href="mailto:${safeEmail}" style="color:#1d1915;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#665d52;vertical-align:top;">Work link</td>
              <td style="padding:6px 0;">${portfolioHtml}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px 6px 0;color:#665d52;vertical-align:top;">Submitted</td>
              <td style="padding:6px 0;color:#595046;">${safeSubmittedAt}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #ddd6c8;margin:20px 0;" />
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#665d52;">
            Applicant Note
          </p>
          <p style="margin:0;font-size:14px;line-height:1.68;color:#1d1915;">
            ${safeNote}
          </p>
        </div>
      </div>
    `.trim(),
  };
}

export function buildApplicantConfirmationPayload(
  record: StoredApplicationRecord,
  options: { from: string; replyTo: string },
) {
  const safeName = escapeHtml(record.name);
  const safeRole = escapeHtml(record.role);
  const safeId = escapeHtml(record.id);

  return {
    from: options.from,
    to: [record.email],
    replyTo: options.replyTo,
    subject: `Application received (${record.id}) — Diwan Mercantile`,
    text: [
      `Hi ${record.name},`,
      '',
      `We received your application for ${record.role} at Diwan Mercantile.`,
      `Reference ID: ${record.id}`,
      '',
      'We review every submission directly based on the work you shared and reply by email.',
      '',
      'Diwan Mercantile',
      'Ramesh Nagar, Bengaluru 560082',
    ].join('\n'),
    html: `
      <div style="background:#f5f1e8;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1d1915;">
        <div style="max-width:560px;margin:0 auto;background:#fffdf9;border:1px solid #ddd6c8;padding:28px;">
          <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#b84121;">
            Diwan Mercantile · ${safeId}
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            Hi ${safeName},
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            We received your application for <strong>${safeRole}</strong>.
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#595046;">
            We review every submission directly based on the work you shared and reply by email.
          </p>
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#665d52;">
            Ramesh Nagar, Bengaluru 560082
          </p>
        </div>
      </div>
    `.trim(),
  };
}

export function buildCandidateReplyPayload(params: {
  to: string;
  referenceId?: string;
  subject: string;
  body: string;
  from: string;
  replyTo: string;
}) {
  const safeRef = escapeHtml((params.referenceId || '').trim());
  const headerLine = safeRef ? `Diwan Mercantile · ${safeRef}` : 'Diwan Mercantile';

  const blocks = params.body
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      const parts: string[] = [];
      let textBuf: string[] = [];
      let listBuf: string[] = [];

      const flushText = () => {
        if (textBuf.length === 0) return;
        parts.push(
          `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#1d1915;">${textBuf.map(escapeHtml).join('<br />')}</p>`,
        );
        textBuf = [];
      };

      const flushList = () => {
        if (listBuf.length === 0) return;
        const itemsHtml = listBuf
          .map((item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`)
          .join('');
        parts.push(
          `<ul style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.65;color:#1d1915;">${itemsHtml}</ul>`,
        );
        listBuf = [];
      };

      for (const line of lines) {
        if (line.startsWith('- ')) {
          flushText();
          listBuf.push(line.slice(2));
        } else {
          flushList();
          textBuf.push(line);
        }
      }
      flushText();
      flushList();

      return parts.join('');
    })
    .join('');

  return {
    from: params.from,
    to: [params.to.trim()],
    replyTo: params.replyTo,
    subject: params.subject.trim(),
    text: params.body.trim(),
    html: `
      <div style="background:#f5f1e8;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1d1915;">
        <div style="max-width:600px;margin:0 auto;background:#fffdf9;border:1px solid #ddd6c8;padding:28px;">
          <p style="margin:0 0 16px;font-family:monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#b84121;">
            ${headerLine}
          </p>
          ${blocks}
          <hr style="border:none;border-top:1px solid #ddd6c8;margin:20px 0 14px;" />
          <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#665d52;">
            Diwan Mercantile · Ramesh Nagar, Bengaluru 560082
          </p>
        </div>
      </div>
    `.trim(),
  };
}
