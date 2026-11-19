import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { CareersView } from '@/src/components/CareersView';
import { Hero } from '@/src/components/Hero';
import { HomeSections } from '@/src/components/HomeSections';
import { ResearchView } from '@/src/components/ResearchView';
import { SiteFooter } from '@/src/components/SiteFooter';
import { SiteHeader } from '@/src/components/SiteHeader';
import { StudioView } from '@/src/components/StudioView';
import {
  parseRoute,
  type AppRoute,
  type HeroLayout,
  type ParsedRoute,
} from '@/src/lib/site';

const ROUTE_TITLES: Record<AppRoute, string> = {
  '/': 'Diwan Mercantile — Bengaluru',
  '/research': 'Research Field Notes — Diwan Mercantile',
  '/careers': 'Careers — Diwan Mercantile',
  '/studio': 'Studio Ledger — Diwan Mercantile',
};

export default function App() {
  const [parsed, setParsed] = useState<ParsedRoute>(() =>
    parseRoute(window.location.pathname),
  );
  const [heroLayout, setHeroLayout] = useState<HeroLayout>(1);
  const pendingHashRef = useRef<string | null>(
    window.location.hash ? window.location.hash.slice(1) : null,
  );

  useEffect(() => {
    document.title = ROUTE_TITLES[parsed.route];
  }, [parsed.route]);

  useEffect(() => {
    const hash = pendingHashRef.current;
    if (!hash) return;
    pendingHashRef.current = null;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [parsed]);

  useEffect(() => {
    const handlePopState = () => {
      pendingHashRef.current = window.location.hash
        ? window.location.hash.slice(1)
        : null;
      setParsed(parseRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleStudioShortcut = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable
      ) {
        return;
      }
      const pressed =
        (e.ctrlKey || e.altKey) &&
        e.shiftKey &&
        (e.code === 'KeyL' || e.key.toLowerCase() === 'l');
      if (!pressed) return;
      e.preventDefault();
      if (parsed.route !== '/studio') {
        window.history.pushState({}, '', '/studio');
        setParsed({ route: '/studio' });
        window.scrollTo({ top: 0 });
      }
    };
    window.addEventListener('keydown', handleStudioShortcut);
    return () => window.removeEventListener('keydown', handleStudioShortcut);
  }, [parsed.route]);

  const navigate = (href: string) => {
    const [rawPath, hash] = href.split('#');
    const nextParsed = parseRoute(rawPath || '/');
    const isSamePage =
      nextParsed.route === parsed.route &&
      nextParsed.researchSlug === parsed.researchSlug;

    if (!isSamePage) {
      pendingHashRef.current = hash || null;
      window.history.pushState({}, '', href);
      setParsed(nextParsed);
      if (!hash) {
        window.scrollTo({ top: 0 });
      }
      return;
    }

    if (href !== window.location.pathname + window.location.hash) {
      window.history.pushState({}, '', href);
    }

    if (hash) {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (parsed.route === '/studio') {
    return (
      <MotionConfig reducedMotion="user">
        <StudioView onNavigate={navigate} />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-ink focus:px-4 focus:py-2 focus:text-[12px] focus:text-field"
        >
          Skip to content
        </a>

        <SiteHeader
          currentRoute={parsed.route}
          heroLayout={heroLayout}
          onNavigate={navigate}
        />

        <main id="main" className="flex-1">
          {parsed.route === '/careers' ? (
            <CareersView />
          ) : parsed.route === '/research' ? (
            <ResearchView slug={parsed.researchSlug} onNavigate={navigate} />
          ) : (
            <>
              <Hero layout={heroLayout} onLayoutChange={setHeroLayout} />
              <HomeSections onNavigate={navigate} />
            </>
          )}
        </main>

        <SiteFooter onNavigate={navigate} />
      </div>
    </MotionConfig>
  );
}
