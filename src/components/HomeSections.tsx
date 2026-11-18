import { useState } from 'react';
import { motion } from 'motion/react';
import { REGISTRATION, SIKKA_PRODUCT, SITE } from '@/src/lib/site';
import { Label } from './Ui';

interface HomeSectionsProps {
  onNavigate: (href: string) => void;
}

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

const revealProps = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.8, ease: STUDIO_EASE },
};

export function HomeSections({ onNavigate }: HomeSectionsProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {/* ── Product: Sikka ─────────────────────────────────────── */}
      <motion.section
        {...revealProps}
        id="product"
        aria-labelledby="product-label"
        className="gutter py-16 sm:py-24"
      >
        <div className="shell">
          <Label as="p" id="product-label">
            Product
          </Label>

          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
              <span>{SIKKA_PRODUCT.name}</span>
            </div>

            <h2 className="mt-3 max-w-[26ch] text-[clamp(1.5rem,2.5vw,2.1rem)] leading-[1.18] tracking-[-0.025em]">
              {SIKKA_PRODUCT.headline}
            </h2>

            <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
              {SIKKA_PRODUCT.summary}
            </p>

            <div className="mt-8 grid max-w-[62rem] gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
              <a
                href={SIKKA_PRODUCT.url}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden border border-line bg-paper transition-colors duration-500 hover:border-accent"
              >
                {!imageError ? (
                  <img
                    src={SIKKA_PRODUCT.imageSrc}
                    alt={SIKKA_PRODUCT.imageAlt}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="flex aspect-[16/10] w-full flex-col justify-between bg-paper p-6">
                    <span className="label">{SIKKA_PRODUCT.name}</span>
                    <p className="max-w-[26ch] text-[1.25rem] font-medium leading-tight tracking-[-0.02em] text-ink">
                      {SIKKA_PRODUCT.headline}
                    </p>
                  </div>
                )}
              </a>

              <div className="flex flex-col justify-between gap-6">
                <ul className="space-y-3">
                  {SIKKA_PRODUCT.highlights.map((detail) => (
                    <li
                      key={detail}
                      className="text-[14px] leading-[1.6] text-ink-2"
                    >
                      {detail}
                    </li>
                  ))}
                </ul>

                <div>
                  <p className="text-[1rem] leading-tight tracking-[-0.015em] text-ink-2">
                    Open{' '}
                    <a
                      href={SIKKA_PRODUCT.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
                    >
                      {SIKKA_PRODUCT.name}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Cohort / Careers Teaser ────────────────────────────── */}
      <motion.section
        {...revealProps}
        aria-labelledby="cohort-label"
        className="gutter py-14 sm:py-20"
      >
        <div className="shell">
          <Label as="p" id="cohort-label">
            Careers
          </Label>

          <div>
            <h2 className="max-w-[28ch] text-[clamp(1.375rem,2.3vw,1.85rem)] leading-[1.25] tracking-[-0.025em]">
              Internship programme 2026–27 — applications open.
            </h2>
            <p className="mt-4 max-w-[50ch] text-[15px] leading-[1.65] text-ink-2">
              First multidisciplinary cohort across product research, strategy,
              design, growth, and software development.
            </p>
            <a
              href="/careers"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/careers');
              }}
              className="mt-6 inline-block text-[1rem] leading-tight tracking-[-0.015em] text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
            >
              View open positions and apply
            </a>
          </div>
        </div>
      </motion.section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <motion.section
        {...revealProps}
        id="contact"
        aria-labelledby="contact-label"
        className="gutter py-14 sm:py-20"
      >
        <div className="shell">
          <Label as="p" id="contact-label">
            Contact
          </Label>

          <div>
            <h2 className="max-w-[22ch] text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.15]">
              Direct enquiries.
            </h2>

            <a
              href={`mailto:${SITE.contactEmail}`}
              className="mt-6 inline-block text-[clamp(1rem,2vw,1.375rem)] leading-tight tracking-[-0.02em] text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
            >
              {SITE.contactEmail}
            </a>

            <dl className="mt-10 flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
              <div className="flex items-baseline gap-2">
                <dt className="label">Address</dt>
                <dd className="text-[12px] text-ink-2">
                  {REGISTRATION.locality}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="label">GSTIN</dt>
                <dd className="font-mono text-[11px] tracking-[0.02em]">
                  {REGISTRATION.gstin}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="label">Udyam</dt>
                <dd className="font-mono text-[11px] tracking-[0.02em]">
                  {REGISTRATION.udyam}
                </dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="label">Entity</dt>
                <dd className="text-[12px] text-ink-2">
                  {REGISTRATION.enterpriseType}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </motion.section>
    </>
  );
}
