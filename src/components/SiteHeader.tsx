import { motion } from 'motion/react';
import { NAV, SITE, type AppRoute, type HeroLayout } from '@/src/lib/site';
import { MobileNav } from './MobileNav';

interface SiteHeaderProps {
  currentRoute: AppRoute;
  heroLayout: HeroLayout;
  onNavigate: (href: string) => void;
}

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

export function SiteHeader({
  currentRoute,
  heroLayout,
  onNavigate,
}: SiteHeaderProps) {
  const showBrand = currentRoute !== '/';
  const isVerticalNav = currentRoute === '/' && heroLayout === 2;

  return (
    <header
      className={`gutter pointer-events-none relative z-40 flex gap-6 ${
        isVerticalNav
          ? 'min-h-[var(--header-h)] items-center justify-end md:items-start md:pt-7 md:pb-2'
          : 'h-[var(--header-h)] items-center'
      } ${showBrand ? 'justify-between' : 'justify-end'}`}
    >
      {showBrand && (
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="label pointer-events-auto shrink-0 whitespace-nowrap text-[11px] tracking-[0.12em] text-accent no-underline transition-colors duration-300 hover:text-ink"
        >
          {SITE.name}
        </a>
      )}

      <motion.nav
        layout="position"
        transition={{ duration: 0.85, ease: STUDIO_EASE }}
        aria-label="Primary"
        className={`pointer-events-auto hidden md:flex ${
          isVerticalNav
            ? 'flex-col items-start gap-2.5'
            : 'flex-row items-center gap-7 lg:gap-10'
        }`}
      >
        {NAV.map((item) => {
          const isCurrent = item.href === currentRoute;
          return (
            <motion.a
              layout="position"
              transition={{ duration: 0.85, ease: STUDIO_EASE }}
              key={item.href}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.href);
              }}
              className="nav-link shrink-0 whitespace-nowrap"
            >
              {item.label}
            </motion.a>
          );
        })}
      </motion.nav>

      <div className="pointer-events-auto md:hidden">
        <MobileNav onNavigate={onNavigate} />
      </div>
    </header>
  );
}
