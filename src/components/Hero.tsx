import { motion } from 'motion/react';
import { REGISTRATION, SITE, type HeroLayout } from '@/src/lib/site';
import { HeroMascot } from './HeroMascot';
import { Label } from './Ui';

interface HeroProps {
  layout: HeroLayout;
  onLayoutChange: (next: HeroLayout) => void;
}

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

export function Hero({ layout, onLayoutChange }: HeroProps) {
  const isAlt = layout === 2;

  return (
    <section
      className={`gutter grid grid-cols-1 content-between gap-y-8 pb-10 pt-2 sm:pt-4 lg:min-h-[100dvh] lg:grid-cols-[13rem_minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto] lg:content-normal lg:gap-x-8 lg:gap-y-0 lg:pt-7 ${
        isAlt
          ? 'min-h-[calc(100dvh-var(--header-h))] lg:-mt-[8.125rem]'
          : 'min-h-[calc(100dvh-var(--header-h))] lg:-mt-[var(--header-h)]'
      }`}
      aria-labelledby="hero-title"
    >
      {/* Wordmark: top-left in Layout 1; moves top-center-right beside vertical nav in Layout 2 */}
      <motion.h1
        id="hero-title"
        layout="position"
        initial={{ y: 26, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.9,
          ease: STUDIO_EASE,
          layout: { duration: 0.9, ease: STUDIO_EASE },
        }}
        className={`font-medium leading-[0.94] tracking-[-0.025em] text-accent ${
          isAlt
            ? 'text-[clamp(2.35rem,4.3vw,4.2rem)] lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:mr-[10.5rem] lg:self-start lg:justify-self-end lg:text-right'
            : 'text-[clamp(2.85rem,6.6vw,6.25rem)] lg:col-start-1 lg:col-span-3 lg:row-start-1 lg:mr-[26rem] lg:self-start lg:justify-self-start lg:text-left'
        }`}
      >
        {SITE.name}
      </motion.h1>

      {/* Layout 1 / 2 switch: upper-mid-right in Layout 1; mid-left below statement in Layout 2 */}
      <motion.div
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.8,
          delay: 0.25,
          ease: STUDIO_EASE,
          layout: { duration: 0.9, ease: STUDIO_EASE },
        }}
        className={`flex items-center ${
          isAlt
            ? 'justify-start lg:col-start-1 lg:row-start-2 lg:self-start lg:justify-self-start lg:pt-8'
            : 'justify-start lg:col-start-3 lg:row-start-2 lg:self-start lg:justify-self-end lg:mr-[12%] lg:pt-6'
        }`}
      >
        <div
          className="flex items-center gap-4"
          role="group"
          aria-label="Hero layout"
        >
          <span className="label">Layout</span>
          <div className="flex items-center gap-2">
            {([1, 2] as const).map((option) => {
              const active = layout === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onLayoutChange(option)}
                  className={`relative flex h-8 w-8 cursor-pointer items-center justify-center font-mono text-[11px] tabular-nums transition-colors duration-300 ${
                    active ? 'text-ink' : 'text-ink-3 hover:text-accent'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="hero-layout-ring"
                      aria-hidden="true"
                      transition={{ duration: 0.65, ease: STUDIO_EASE }}
                      className="absolute inset-0 rounded-full border border-accent"
                    />
                  )}
                  <span className="relative z-10">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Statement: lower-mid column 2 in Layout 1; moves top-left in Layout 2 */}
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.85,
          delay: 0.16,
          ease: STUDIO_EASE,
          layout: { duration: 0.9, ease: STUDIO_EASE },
        }}
        className={
          isAlt
            ? 'lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:self-start'
            : 'lg:col-start-2 lg:row-start-2 lg:self-end lg:pb-12'
        }
      >
        <p className="max-w-[28ch] text-[clamp(1.4rem,2.3vw,2rem)] font-medium leading-[1.28] tracking-[-0.015em] text-ink">
          {SITE.heroStatement}
        </p>
      </motion.div>

      {/* Mascot focal anchor: bottom-right in Layout 1; lower-center in Layout 2 */}
      <motion.div
        layout="position"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.9,
          delay: 0.28,
          ease: STUDIO_EASE,
          layout: { duration: 0.9, ease: STUDIO_EASE },
        }}
        className={`flex items-end ${
          isAlt
            ? 'justify-center lg:col-start-2 lg:row-start-2 lg:row-span-2 lg:self-end lg:justify-self-end lg:pb-2'
            : 'justify-center lg:col-start-3 lg:row-start-2 lg:row-span-2 lg:self-end lg:justify-self-end'
        }`}
      >
        <HeroMascot />
      </motion.div>

      {/* Locality: bottom-left in Layout 1; moves mid-right below vertical nav in Layout 2 */}
      <motion.div
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.85,
          delay: 0.22,
          ease: STUDIO_EASE,
          layout: { duration: 0.9, ease: STUDIO_EASE },
        }}
        className={`flex flex-col gap-1 ${
          isAlt
            ? 'lg:col-start-3 lg:row-start-2 lg:self-start lg:justify-self-end lg:text-right lg:pt-8'
            : 'lg:col-start-1 lg:row-start-3 lg:self-end'
        }`}
      >
        <Label>{REGISTRATION.locality}</Label>
      </motion.div>

      {/* Email & GSTIN: bottom column 2 in Layout 1; moves bottom-right in Layout 2 */}
      <motion.div
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.85,
          delay: 0.22,
          ease: STUDIO_EASE,
          layout: { duration: 0.9, ease: STUDIO_EASE },
        }}
        className={`flex flex-col gap-2 ${
          isAlt
            ? 'lg:col-start-3 lg:row-start-3 lg:self-end lg:justify-self-end lg:items-end lg:text-right'
            : 'sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-8 lg:col-start-2 lg:row-start-3 lg:self-end'
        }`}
      >
        <a
          href={`mailto:${SITE.contactEmail}`}
          className="label w-fit underline decoration-line underline-offset-4 transition-colors duration-300 hover:text-accent hover:decoration-accent"
        >
          {SITE.contactEmail}
        </a>
        <Label>GSTIN {REGISTRATION.gstin}</Label>
      </motion.div>
    </section>
  );
}
