import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  RESEARCH_OPEN_QUESTIONS,
  RESEARCH_POSTS,
  type ResearchKind,
  type ResearchPost,
} from '@/src/lib/site';
import { MarkdownBody } from './MarkdownBody';
import { Label } from './Ui';

interface ResearchViewProps {
  slug?: string;
  onNavigate: (href: string) => void;
}

const STUDIO_EASE = [0.22, 1, 0.36, 1] as const;

const KIND_LABELS: Record<'all' | ResearchKind, string> = {
  all: 'All entries',
  note: 'Notes',
  essay: 'Essays',
  link: 'Curated links',
};

const SINGULAR_KIND_LABELS: Record<ResearchKind, string> = {
  note: 'Note',
  essay: 'Essay',
  link: 'Curated link',
};

function formatPostDate(iso: string): string {
  if (!iso) return '2026';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '2026';
  return parsed.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
}

export function ResearchView({ slug, onNavigate }: ResearchViewProps) {
  const [posts, setPosts] = useState<readonly ResearchPost[]>(RESEARCH_POSTS);
  const [kindFilter, setKindFilter] = useState<'all' | ResearchKind>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data: { ok?: boolean; posts?: ResearchPost[] }) => {
        if (active && data.ok && Array.isArray(data.posts)) {
          setPosts(data.posts);
        }
      })
      .catch(() => {
        // Retain built-in empty default when offline.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activePostIndex = useMemo(() => {
    if (!slug) return -1;
    return posts.findIndex((p) => p.slug === slug);
  }, [posts, slug]);

  const activePost = activePostIndex >= 0 ? posts[activePostIndex] : null;

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (kindFilter !== 'all' && post.kind !== kindFilter) return false;
      return true;
    });
  }, [posts, kindFilter]);

  if (slug) {
    if (!activePost && loading) {
      return (
        <section className="gutter py-16">
          <div className="shell">
            <Label>Research</Label>
            <p className="text-[15px] text-ink-2">Loading field note…</p>
          </div>
        </section>
      );
    }

    if (!activePost) {
      return (
        <section className="gutter py-16">
          <div className="shell">
            <Label>Research</Label>
            <div className="max-w-[44ch]">
              <h1 className="text-[clamp(1.6rem,3vw,2.2rem)] leading-[1.15] text-ink">
                Entry not found.
              </h1>
              <p className="mt-3 text-[15px] leading-[1.65] text-ink-2">
                This note may have moved or remains an unpublished draft.
              </p>
              <a
                href="/research"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/research');
                }}
                className="mt-6 inline-block text-[14px] text-ink underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
              >
                ← Back to Field Notes
              </a>
            </div>
          </div>
        </section>
      );
    }

    const prevPost = activePostIndex > 0 ? posts[activePostIndex - 1] : null;
    const nextPost =
      activePostIndex >= 0 && activePostIndex < posts.length - 1
        ? posts[activePostIndex + 1]
        : null;

    return (
      <motion.article
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: STUDIO_EASE }}
        className="gutter pb-16 pt-8 sm:pt-12"
      >
        <div className="shell">
          <aside className="space-y-6 lg:sticky lg:top-8">
            <a
              href="/research"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/research');
              }}
              className="inline-block font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
            >
              ← Field Notes
            </a>

            <dl className="space-y-4 border-t border-line pt-5">
              <div>
                <dt className="label">Basis</dt>
                <dd className="mt-1 text-[13.5px] font-medium text-ink">
                  {activePost.basis}
                </dd>
              </div>
              <div>
                <dt className="label">Format</dt>
                <dd className="mt-1 text-[13.5px] text-ink-2">
                  {SINGULAR_KIND_LABELS[activePost.kind]} · {activePost.readingMinutes} min read
                </dd>
              </div>
              <div>
                <dt className="label">Published</dt>
                <dd className="mt-1 font-mono text-[12px] tabular-nums text-ink-2">
                  {formatPostDate(activePost.publishedAt)}
                </dd>
              </div>
              {activePost.tags.length > 0 && (
                <div>
                  <dt className="label">Topics</dt>
                  <dd className="mt-1 text-[13px] text-ink-2">
                    {activePost.tags.join(' · ')}
                  </dd>
                </div>
              )}
              {activePost.sourceUrl && (
                <div>
                  <dt className="label">External Source</dt>
                  <dd className="mt-1">
                    <a
                      href={activePost.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13.5px] text-ink underline decoration-ink/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                    >
                      {activePost.sourceLabel || activePost.sourceUrl} ↗
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </aside>

          <div className="max-w-[62ch]">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              {activePost.basis}
            </p>
            <h1 className="mt-3 text-[clamp(1.75rem,3.6vw,2.65rem)] leading-[1.12] tracking-[-0.03em] text-ink">
              {activePost.title}
            </h1>
            {activePost.dek && (
              <p className="mt-4 text-[17px] leading-[1.6] text-ink-2">
                {activePost.dek}
              </p>
            )}

            <div className="mt-8 border-t border-line pt-8">
              <MarkdownBody markdown={activePost.bodyMd} />
            </div>

            {activePost.sourceUrl && (
              <div className="mt-8 border-y border-line py-4">
                <span className="label mr-3">Original source</span>
                <a
                  href={activePost.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[14.5px] text-ink underline decoration-ink/40 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                >
                  Read full piece on {activePost.sourceLabel || activePost.sourceUrl} ↗
                </a>
              </div>
            )}

            {(prevPost || nextPost) && (
              <nav
                aria-label="Adjacent notes"
                className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-2"
              >
                <div>
                  {prevPost && (
                    <a
                      href={`/research/${prevPost.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/research/${prevPost.slug}`);
                      }}
                      className="group block"
                    >
                      <span className="label">← Newer</span>
                      <p className="mt-1.5 text-[15px] leading-[1.35] text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:text-accent group-hover:decoration-accent">
                        {prevPost.title}
                      </p>
                    </a>
                  )}
                </div>
                <div className="sm:text-right">
                  {nextPost && (
                    <a
                      href={`/research/${nextPost.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(`/research/${nextPost.slug}`);
                      }}
                      className="group block"
                    >
                      <span className="label">Older →</span>
                      <p className="mt-1.5 text-[15px] leading-[1.35] text-ink underline decoration-transparent underline-offset-4 transition-colors group-hover:text-accent group-hover:decoration-accent">
                        {nextPost.title}
                      </p>
                    </a>
                  )}
                </div>
              </nav>
            )}
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <>
      {/* ── Editorial Opening ───────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: STUDIO_EASE }}
        aria-labelledby="research-page-label"
        className="gutter pb-10 pt-8 sm:pb-14 sm:pt-12"
      >
        <div className="shell">
          <Label as="p" id="research-page-label">
            Research
          </Label>

          <div className="max-w-[54rem]">
            <h1 className="max-w-[22ch] text-[clamp(1.9rem,4vw,2.85rem)] leading-[1.08] tracking-[-0.03em] text-accent">
              Field notes, working essays &amp; readings.
            </h1>
            <p className="mt-4 max-w-[56ch] text-[15.5px] leading-[1.68] text-ink-2">
              Working notes as Diwan Mercantile studies retail workflows,
              operational software, and small-business unit economics. Every
              entry states its exact basis—whether architecture synthesis, field
              visit, or curated external reading.
            </p>
          </div>
        </div>
      </motion.section>

      {/* ── Open Questions (Only shown when configured/published) ── */}
      {RESEARCH_OPEN_QUESTIONS.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: STUDIO_EASE }}
          aria-labelledby="open-questions-label"
          className="gutter pb-10 sm:pb-14"
        >
          <div className="shell">
            <Label as="p" id="open-questions-label">
              Open questions
            </Label>

            <ol className="max-w-[54rem] divide-y divide-line border-y border-line">
              {RESEARCH_OPEN_QUESTIONS.map((question, idx) => (
                <li
                  key={question}
                  className="grid gap-2 py-3.5 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:items-baseline sm:gap-5"
                >
                  <span className="font-mono text-[11px] tabular-nums tracking-[0.14em] text-accent">
                    Q0{idx + 1}
                  </span>
                  <p className="text-[14.5px] leading-[1.6] text-ink">{question}</p>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>
      )}

      {/* ── Chronological Index ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.14, ease: STUDIO_EASE }}
        aria-labelledby="journal-label"
        className="gutter py-6 sm:py-10"
      >
        <div className="shell">
          <div className="space-y-4">
            <Label as="p" id="journal-label">
              Index
            </Label>
          </div>

          <div className="max-w-[54rem]">
            {loading ? (
              <p className="py-6 text-[15px] text-ink-3">Loading entries…</p>
            ) : posts.length === 0 ? (
              <div className="border-y border-line py-10">
                <p className="text-[15px] text-ink-2">
                  No field notes or essays published yet.
                </p>
              </div>
            ) : (
              <>
                <div
                  role="tablist"
                  aria-label="Filter research entries"
                  className="flex flex-wrap items-center gap-1 border-b border-line pb-4"
                >
                  {(['all', 'note', 'essay', 'link'] as const).map((kind) => {
                    const active = kindFilter === kind;
                    return (
                      <button
                        key={kind}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setKindFilter(kind)}
                        className={`cursor-pointer whitespace-nowrap px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 ${
                          active
                            ? 'bg-ink text-field'
                            : 'text-ink-2 hover:bg-clay/70 hover:text-ink'
                        }`}
                      >
                        {KIND_LABELS[kind]}
                      </button>
                    );
                  })}
                </div>

                {filteredPosts.length === 0 ? (
                  <div className="py-12">
                    <p className="text-[15px] text-ink-2">
                      No entries match this filter yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setKindFilter('all');
                      }}
                      className="mt-3 cursor-pointer text-[14px] text-accent underline underline-offset-4"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <ol className="divide-y divide-line border-b border-line">
                    {filteredPosts.map((entry) => (
                      <li key={entry.slug} className="py-7">
                        <p className="text-[13px] leading-snug text-ink-3">
                          {formatPostDate(entry.publishedAt)}
                        </p>

                        <h2 className="mt-2 text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.22] tracking-[-0.02em] text-ink">
                          <a
                            href={`/research/${entry.slug}`}
                            onClick={(e) => {
                              e.preventDefault();
                              onNavigate(`/research/${entry.slug}`);
                            }}
                            className="transition-colors duration-200 hover:text-accent"
                          >
                            {entry.title}
                          </a>
                        </h2>

                        <p className="mt-2.5 max-w-[58ch] text-[15px] leading-[1.68] text-ink-2">
                          {entry.dek}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            )}

            <div className="mt-10 flex flex-wrap items-baseline justify-between gap-4">
              <p className="text-[14.5px] text-ink-2">
                Interested in contributing original field work?
              </p>
              <a
                href="/careers"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/careers');
                }}
                className="text-[14.5px] text-ink underline decoration-ink/40 underline-offset-4 transition-colors duration-200 hover:text-accent hover:decoration-accent"
              >
                Explore the 2026–27 cohort →
              </a>
            </div>
          </div>
        </div>
      </motion.section>
    </>
  );
}
