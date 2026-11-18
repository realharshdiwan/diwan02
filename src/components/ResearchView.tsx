import { motion } from 'motion/react';
import { RESEARCH_STUDIES } from '@/src/lib/site';
import { Label } from './Ui';

interface ResearchViewProps {
  onNavigate: (href: string) => void;
}

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

export function ResearchView({ onNavigate }: ResearchViewProps) {
  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: STUDIO_EASE }}
        aria-labelledby="research-page-label"
        className="gutter pb-12 pt-8 sm:pb-16 sm:pt-12"
      >
        <div className="shell">
          <Label as="p" id="research-page-label">
            Research
          </Label>

          <div>
            <h1 className="max-w-[24ch] text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] text-accent">
              Field journal & studio analysis.
            </h1>
            <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.7] text-ink-2">
              Written notes sharing Diwan Mercantile&apos;s observations and
              practical takeaways after investigating specific markets and
              operating workflows.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.12, ease: STUDIO_EASE }}
        aria-labelledby="journal-label"
        className="gutter py-10 sm:py-14"
      >
        <div className="shell">
          <Label as="p" id="journal-label">
            Essays
          </Label>

          <div className="space-y-16">
            {RESEARCH_STUDIES.map((entry) => (
              <article key={entry.n} className="max-w-[60ch]">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <span>Note {entry.n}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.readTime}</span>
                  <span aria-hidden="true">·</span>
                  <span>{entry.sector}</span>
                </div>

                <h2 className="mt-3 text-[clamp(1.45rem,2.6vw,2rem)] leading-[1.2] tracking-[-0.025em] text-ink">
                  {entry.title}
                </h2>

                <p className="mt-4 text-[16px] leading-[1.65] text-ink">
                  {entry.dek}
                </p>

                <div className="mt-6 space-y-5">
                  {entry.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-[15px] leading-[1.75] text-ink-2"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-8 bg-paper p-6 sm:p-7">
                  <Label as="p">Studio input after analysis</Label>
                  <p className="mt-2.5 text-[15px] leading-[1.7] text-ink">
                    {entry.studioInput}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.75, ease: STUDIO_EASE }}
        aria-labelledby="archive-status-label"
        className="gutter py-10 sm:py-16"
      >
        <div className="shell">
          <Label as="p" id="archive-status-label">
            Ongoing
          </Label>

          <div className="max-w-[50ch]">
            <p className="text-[15px] leading-[1.65] text-ink-2">
              New field essays and market evaluations are published here as each
              study concludes.
            </p>
            <a
              href="/careers"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/careers');
              }}
              className="mt-5 inline-block text-[1rem] leading-tight tracking-[-0.015em] text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
            >
              Contribute to research in the 2026–27 cohort
            </a>
          </div>
        </div>
      </motion.section>
    </>
  );
}
