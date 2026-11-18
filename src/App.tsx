import { useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'motion/react';
import { CareersView } from '@/src/components/CareersView';
import { Hero } from '@/src/components/Hero';
import { HomeSections } from '@/src/components/HomeSections';
import { ResearchView } from '@/src/components/ResearchView';
import { SiteFooter } from '@/src/components/SiteFooter';
import { SiteHeader } from '@/src/components/SiteHeader';
import { normalizeRoute, type AppRoute, type HeroLayout } from '@/src/lib/site';

const ROUTE_TITLES: Record<AppRoute, string> = {
  '/': 'Diwan Mercantile — Bengaluru',
  '/research': 'Research Journal — Diwan Mercantile',
  '/careers': 'Careers — Diwan Mercantile',
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    normalizeRoute(window.location.pathname),
  );
  const [heroLayout, setHeroLayout] = useState<HeroLayout>(1);
  const pendingHashRef = useRef<string | null>(
    window.location.hash ? window.location.hash.slice(1) : null,
  );

  useEffect(() => {
    document.title = ROUTE_TITLES[route];
  }, [route]);

  useEffect(() => {
    const hash = pendingHashRef.current;
    if (!hash) return;
    pendingHashRef.current = null;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [route]);

  useEffect(() => {
    const handlePopState = () => {
      pendingHashRef.current = window.location.hash
        ? window.location.hash.slice(1)
        : null;
      setRoute(normalizeRoute(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (href: string) => {
    const [rawPath, hash] = href.split('#');
    const nextRoute = normalizeRoute(rawPath || '/');

    if (nextRoute !== route) {
      pendingHashRef.current = hash || null;
      window.history.pushState({}, '', href);
      setRoute(nextRoute);
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
          currentRoute={route}
          heroLayout={heroLayout}
          onNavigate={navigate}
        />

        <main id="main" className="flex-1">
          {route === '/careers' ? (
            <CareersView />
          ) : route === '/research' ? (
            <ResearchView onNavigate={navigate} />
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
