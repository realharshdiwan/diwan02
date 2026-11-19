import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CAREERS_FAQ,
  DEFAULT_VENTURES,
  SITE,
  STUDIO_FAQ,
  type VentureRecord,
} from '@/src/lib/site';
import { Label } from './Ui';

interface HomeSectionsProps {
  onNavigate: (href: string) => void;
}

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

const revealProps = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: STUDIO_EASE },
};

const FAQ_ITEMS = [...STUDIO_FAQ, ...CAREERS_FAQ];

export function HomeSections({ onNavigate }: HomeSectionsProps) {
  const [ventures, setVentures] = useState<VentureRecord[]>([
    ...DEFAULT_VENTURES,
  ]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [openFaqQuestion, setOpenFaqQuestion] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/ventures')
      .then((res) => res.json())
      .then((data: { ok?: boolean; ventures?: VentureRecord[] }) => {
        if (
          active &&
          data.ok &&
          Array.isArray(data.ventures) &&
          data.ventures.length > 0
        ) {
          setVentures(data.ventures);
        }
      })
      .catch(() => {
        // Keep built-in venture seed cleanly.
      });
    return () => {
      active = false;
    };
  }, []);

  const primaryVenture =
    ventures.find((v) => v.featured) || ventures[0] || DEFAULT_VENTURES[0];
  const secondaryVentures = ventures.filter(
    (v) => v.slug !== primaryVenture.slug && v.id !== primaryVenture.id,
  );

  return (
    <>
      {/* ── Ventures Showcase ───────────────────────────────────── */}
      <motion.section
        {...revealProps}
        id="ventures"
        aria-labelledby="ventures-label"
        className="gutter py-16 sm:py-24"
      >
        <div className="shell">
          <Label as="p" id="ventures-label">
            Ventures
          </Label>

          <div>
            <div>
              <span className="font-serif text-[17px] font-semibold tracking-[-0.015em] text-ink">
                {primaryVenture.name}
              </span>
            </div>

            <h2 className="mt-3 max-w-[26ch] text-[clamp(1.5rem,2.5vw,2.1rem)] leading-[1.18] tracking-[-0.02em]">
              {primaryVenture.headline}
            </h2>

            {primaryVenture.summary && (
              <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.65] text-ink-2">
                {primaryVenture.summary}
              </p>
            )}

            <div className="mt-8 grid max-w-[62rem] gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
              {primaryVenture.url ? (
                <a
                  href={primaryVenture.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden border border-line bg-paper transition-colors duration-500 hover:border-accent"
                >
                  {primaryVenture.imageSrc && !failedImages[primaryVenture.id] ? (
                    <img
                      src={primaryVenture.imageSrc}
                      alt={primaryVenture.imageAlt || primaryVenture.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [primaryVenture.id]: true,
                        }))
                      }
                      className="block aspect-[16/10] w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full flex-col justify-between bg-paper p-6">
                      <span className="label">{primaryVenture.name}</span>
                      <p className="max-w-[26ch] text-[1.25rem] font-medium leading-tight text-ink">
                        {primaryVenture.headline}
                      </p>
                    </div>
                  )}
                </a>
              ) : (
                <div className="overflow-hidden border border-line bg-paper">
                  {primaryVenture.imageSrc && !failedImages[primaryVenture.id] ? (
                    <img
                      src={primaryVenture.imageSrc}
                      alt={primaryVenture.imageAlt || primaryVenture.name}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [primaryVenture.id]: true,
                        }))
                      }
                      className="block aspect-[16/10] w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full flex-col justify-between bg-paper p-6">
                      <span className="label">{primaryVenture.name}</span>
                      <p className="max-w-[26ch] text-[1.25rem] font-medium leading-tight text-ink">
                        {primaryVenture.headline}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col justify-between gap-6">
                {primaryVenture.highlights.length > 0 && (
                  <ul className="space-y-3">
                    {primaryVenture.highlights.map((detail) => (
                      <li
                        key={detail}
                        className="text-[14px] leading-[1.6] text-ink-2"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}

                {primaryVenture.url && (
                  <div>
                    <p className="text-[1rem] leading-tight tracking-[-0.01em] text-ink-2">
                      <a
                        href={primaryVenture.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
                      >
                        {primaryVenture.ctaLabel || `Open ${primaryVenture.name}`}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {secondaryVentures.length > 0 && (
              <div className="mt-14 grid max-w-[62rem] gap-8 border-t border-line pt-10 sm:grid-cols-2">
                {secondaryVentures.map((venture) => (
                  <article
                    key={venture.id}
                    className="flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-serif text-[15.5px] font-semibold tracking-[-0.015em] text-ink">
                          {venture.name}
                        </span>
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                          {venture.stageLabel}
                        </span>
                      </div>

                      <h3 className="mt-2.5 text-[1.2rem] font-medium leading-[1.28] text-ink">
                        {venture.headline}
                      </h3>

                      {venture.summary && (
                        <p className="mt-2.5 text-[14px] leading-[1.65] text-ink-2">
                          {venture.summary}
                        </p>
                      )}

                      {venture.highlights.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.55] text-ink-3">
                          {venture.highlights.slice(0, 3).map((item) => (
                            <li key={item}>— {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {venture.url && (
                      <div>
                        <a
                          href={venture.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block text-[14px] text-ink underline decoration-ink/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                        >
                          {venture.ctaLabel || `Open ${venture.name}`} ↗
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* ── Cohort / Careers Teaser ────────────────────────────── */}
      <motion.section
        {...revealProps}
        aria-labelledby="cohort-label"
        className="gutter py-12 sm:py-16"
      >
        <div className="shell">
          <Label as="p" id="cohort-label">
            Careers
          </Label>

          <div>
            <h2 className="max-w-[28ch] text-[clamp(1.375rem,2.3vw,1.85rem)] leading-[1.25] tracking-[-0.02em]">
              Internship programme 2026–27 — applications open.
            </h2>
            <p className="mt-4 max-w-[50ch] text-[15px] leading-[1.65] text-ink-2">
              First cohort across Research, Design &amp; build, and Growth &amp;
              distribution.
            </p>
            <a
              href="/careers"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/careers');
              }}
              className="mt-6 inline-block text-[1rem] leading-tight text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
            >
              View open positions and apply
            </a>
          </div>
        </div>
      </motion.section>

      {/* ── Clean Click-to-Reveal FAQ ─────────────────────────── */}
      <motion.section
        {...revealProps}
        id="faq"
        aria-labelledby="faq-label"
        className="gutter py-12 sm:py-16"
      >
        <div className="shell">
          <Label as="p" id="faq-label">
            FAQ
          </Label>

          <dl className="max-w-[46rem] divide-y divide-line border-y border-line">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqQuestion === item.q;
              const answerId = `faq-answer-${idx}`;
              return (
                <div key={item.q}>
                  <dt>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() =>
                        setOpenFaqQuestion((prev) =>
                          prev === item.q ? null : item.q,
                        )
                      }
                      className="group flex w-full cursor-pointer items-baseline justify-between gap-6 py-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="text-[15.5px] font-medium leading-[1.45] text-ink transition-colors group-hover:text-accent sm:text-[16px]">
                        {item.q}
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 font-mono text-[15px] text-ink-3 transition-colors group-hover:text-accent"
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                  </dt>
                  {isOpen && (
                    <dd
                      id={answerId}
                      className="max-w-[60ch] pb-5 pr-8 pt-0.5 text-[14.5px] leading-[1.65] text-ink-2 sm:text-[15px]"
                    >
                      {item.a}
                    </dd>
                  )}
                </div>
              );
            })}
          </dl>
        </div>
      </motion.section>

      {/* ── Contact ────────────────────────────────────────────── */}
      <motion.section
        {...revealProps}
        id="contact"
        aria-labelledby="contact-label"
        className="gutter py-12 sm:py-16"
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
              className="mt-6 inline-block text-[clamp(1rem,2vw,1.375rem)] leading-tight text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
            >
              {SITE.contactEmail}
            </a>
          </div>
        </div>
      </motion.section>
    </>
  );
}
