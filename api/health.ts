import { SITE } from '../src/lib/site';
import { resolveResendConfig } from '../src/lib/resendEmail';

interface ApiResponse {
  status(code: number): ApiResponse;
  json(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

export default function handler(_req: unknown, res: ApiResponse) {
  const config = resolveResendConfig(process.env, SITE.contactEmail);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    ok: true,
    emailConfigured: Boolean(config.apiKey),
    resendFrom: config.from,
    notifyEmail: config.notifyEmail,
    customResendDomain: config.customDomain,
    runtime: 'vercel',
  });
}
