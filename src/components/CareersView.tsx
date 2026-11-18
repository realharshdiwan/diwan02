import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  INTERNSHIP_PROGRAMME,
  INTERNSHIP_ROLES,
  SITE,
  validateApplication,
  type ApplicationInput,
} from '@/src/lib/site';
import { Label } from './Ui';

const INITIAL_FORM: ApplicationInput = {
  name: '',
  email: '',
  role: INTERNSHIP_ROLES[0].title,
  portfolioUrl: '',
  note: '',
};

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

interface SubmissionReceipt {
  id: string;
  name: string;
  role: string;
  submittedAt: string;
  emailDispatched: boolean;
}

export function CareersView() {
  const [form, setForm] = useState<ApplicationInput>(INITIAL_FORM);
  const [errors, setErrors] = useState<
    Partial<Record<keyof ApplicationInput, string>>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);

  const [honeypot, setHoneypot] = useState('');

  const selectRole = (roleTitle: string) => {
    setForm((prev) => ({ ...prev, role: roleTitle }));
    setReceipt(null);
    setServerError(null);
    setErrors((prev) => ({ ...prev, role: undefined }));
    const target = document.getElementById('apply');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    window.setTimeout(() => {
      document.getElementById('apply-name')?.focus({ preventScroll: true });
    }, 350);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = validateApplication(form);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const response = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website: honeypot }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        id?: string;
        submittedAt?: string;
        emailDispatched?: boolean;
        message?: string;
        errors?: Partial<Record<keyof ApplicationInput, string>>;
      };

      if (!response.ok || !payload.ok || !payload.id) {
        if (payload.errors) {
          setErrors(payload.errors);
        }
        setServerError(
          payload.message ||
            'Could not submit right now. Please try again or email us directly.',
        );
        return;
      }

      setReceipt({
        id: payload.id,
        name: form.name.trim(),
        role: form.role.trim(),
        submittedAt: payload.submittedAt || new Date().toISOString(),
        emailDispatched: Boolean(payload.emailDispatched),
      });
      setForm({ ...INITIAL_FORM, role: form.role });
    } catch {
      setServerError(
        `Network error while sending application. Email ${SITE.contactEmail} directly.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Minimal Opening ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: STUDIO_EASE }}
        aria-labelledby="careers-label"
        className="gutter pb-12 pt-8 sm:pb-16 sm:pt-12"
      >
        <div className="shell">
          <Label as="p" id="careers-label">
            {INTERNSHIP_PROGRAMME.eyebrow}
          </Label>

          <div className="max-w-[46rem]">
            <h1 className="max-w-[22ch] text-[clamp(1.85rem,4vw,2.75rem)] leading-[1.08] text-accent">
              {INTERNSHIP_PROGRAMME.headline}
            </h1>
            <p className="mt-4 max-w-[54ch] text-[15.5px] leading-[1.68] text-ink-2">
              {INTERNSHIP_PROGRAMME.intro}
            </p>

            <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-3">
              {INTERNSHIP_PROGRAMME.terms.map((item) => (
                <div key={item.label}>
                  <dt className="label">{item.label}</dt>
                  <dd className="mt-1.5 text-[14px] leading-[1.55] text-ink">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 border border-line bg-paper p-6 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label as="p">Ownership & venture route</Label>
                <a
                  href="#positions"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById('positions')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-[13px] text-ink underline decoration-line underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
                >
                  View open roles
                </a>
              </div>

              <ol className="mt-5 grid gap-6 sm:grid-cols-3">
                {INTERNSHIP_PROGRAMME.venturePath.map((item) => (
                  <li key={item.step}>
                    <span className="font-mono text-[11px] tracking-[0.14em] text-accent">
                      {item.step}
                    </span>
                    <p className="mt-1.5 text-[15px] font-medium leading-[1.35] text-ink">
                      {item.title}
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-2">
                      {item.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Open roles ─────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: STUDIO_EASE }}
        id="positions"
        aria-labelledby="positions-label"
        className="gutter py-10 sm:py-14"
      >
        <div className="shell">
          <Label as="p" id="positions-label">
            Open roles
          </Label>

          <ol className="max-w-[48rem] space-y-6">
            {INTERNSHIP_ROLES.map((role) => {
              const isSelected = form.role === role.title;
              return (
                <li key={role.id}>
                  <div className="grid gap-3 py-1 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                    <span className="label">{role.number}</span>
                    <div>
                      <h2 className="text-[1.125rem] leading-[1.25] tracking-[-0.02em] text-ink">
                        {role.title}
                      </h2>
                      <p className="mt-1 max-w-[50ch] text-[14px] leading-[1.55] text-ink-2">
                        {role.focus}{' '}
                        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                          · {role.commitment} · {role.stipend}
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => selectRole(role.title)}
                      className={`cursor-pointer justify-self-start whitespace-nowrap border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-300 sm:justify-self-end ${
                        isSelected
                          ? 'border-accent bg-accent text-paper'
                          : 'border-line bg-paper text-ink hover:border-ink'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Apply'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </motion.section>

      {/* ── Direct Application Form (POST /api/apply) ───────────── */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.8, ease: STUDIO_EASE }}
        id="apply"
        aria-labelledby="apply-label"
        className="gutter py-12 sm:py-18"
      >
        <div className="shell">
          <Label as="p" id="apply-label">
            Apply
          </Label>

          <div className="max-w-[38rem]">
            <h2 className="text-[clamp(1.375rem,2.4vw,1.85rem)] leading-[1.2] tracking-[-0.025em]">
              Submit an application.
            </h2>

            {INTERNSHIP_PROGRAMME.googleFormUrl ? (
              <div className="mt-6">
                <a
                  href={INTERNSHIP_PROGRAMME.googleFormUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block border border-ink bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-field transition-colors hover:border-accent hover:bg-accent"
                >
                  Open cohort application form
                </a>
              </div>
            ) : receipt ? (
              <div role="status" className="mt-6 border border-accent bg-paper p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                  Application received · {receipt.id}
                </p>
                <p className="mt-2 text-[16px] font-medium text-ink">
                  {receipt.name} — {receipt.role}
                </p>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink-2">
                  Your submission has been recorded. Shortlisted applicants are
                  invited for a 20-minute call and a 4-hour work sample.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="cursor-pointer border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-ink hover:text-ink"
                  >
                    Submit another application
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-7 space-y-5"
              >
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="apply-website">Website</label>
                  <input
                    id="apply-website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="apply-role" className="label mb-2 block">
                    Role
                  </label>
                  <select
                    id="apply-role"
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="w-full border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink"
                  >
                    {INTERNSHIP_ROLES.map((r) => (
                      <option key={r.id} value={r.title}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="mt-1.5 text-[13px] text-accent">
                      {errors.role}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="apply-name" className="label mb-2 block">
                      Full name
                    </label>
                    <input
                      id="apply-name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Your name"
                      className="w-full border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3"
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-[13px] text-accent">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="apply-email" className="label mb-2 block">
                      Email
                    </label>
                    <input
                      id="apply-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="you@example.com"
                      className="w-full border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3"
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-[13px] text-accent">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="apply-link" className="label mb-2 block">
                    Link to work, GitHub, or writing
                  </label>
                  <input
                    id="apply-link"
                    type="url"
                    value={form.portfolioUrl}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        portfolioUrl: e.target.value,
                      }))
                    }
                    placeholder="https://"
                    className="w-full border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3"
                  />
                  {errors.portfolioUrl && (
                    <p className="mt-1.5 text-[13px] text-accent">
                      {errors.portfolioUrl}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="apply-note" className="label mb-2 block">
                    What have you built, studied, or analysed?
                  </label>
                  <textarea
                    id="apply-note"
                    rows={4}
                    required
                    value={form.note}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="Share a concrete project, teardown, or problem you investigated."
                    className="w-full border border-line bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-3"
                  />
                  {errors.note && (
                    <p className="mt-1.5 text-[13px] text-accent">
                      {errors.note}
                    </p>
                  )}
                </div>

                {serverError && (
                  <p role="alert" className="text-[13.5px] text-accent">
                    {serverError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-5 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="cursor-pointer border border-ink bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-field transition-colors duration-300 hover:border-accent hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Submitting…' : 'Submit application'}
                  </button>
                  <a
                    href={`mailto:${SITE.contactEmail}?subject=${encodeURIComponent('Cohort 2026–27 Enquiry')}`}
                    className="text-[14px] text-ink-2 underline decoration-line underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
                  >
                    Direct email
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </motion.section>
    </>
  );
}
