-- Diwan Mercantile — Supabase PostgreSQL Schema & Row-Level Security
-- Run once in Supabase SQL Editor after creating your project.

create extension if not exists pgcrypto;

-- 1. Research Field Notes, Essays & Curated Links
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  dek text not null default '',
  body_md text not null default '',
  kind text not null check (kind in ('note', 'essay', 'link')) default 'note',
  basis text not null default 'Desk synthesis',
  tags text[] not null default '{}',
  source_url text not null default '',
  source_label text not null default '',
  status text not null check (status in ('draft', 'published')) default 'draft',
  reading_minutes integer not null default 1 check (reading_minutes >= 1),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc nulls last);

-- 2. Internship Cohorts & Role Briefs
create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  window_label text not null default '',
  summary text not null default '',
  terms jsonb not null default '[]'::jsonb,
  roles jsonb not null default '[]'::jsonb,
  status text not null check (status in ('open', 'upcoming', 'closed')) default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Candidate Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  cohort_slug text not null default '2026-27',
  role_title text not null,
  name text not null,
  email text not null,
  portfolio_url text not null default '',
  note text not null,
  status text not null check (status in ('new', 'shortlisted', 'reviewed', 'archived')) default 'new',
  reviewer_notes text not null default '',
  email_dispatched boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_status_created_idx
  on public.applications (status, created_at desc);

-- 4. Studio Desk (Teamwork & Internal Operations)
create table if not exists public.studio_items (
  id uuid primary key default gen_random_uuid(),
  stream text not null check (stream in ('parchi.', 'Research', 'Cohort Ops', 'Studio')) default 'Studio',
  title text not null,
  status text not null check (status in ('queued', 'in_motion', 'in_review', 'settled')) default 'queued',
  assignee_name text not null default '',
  assignee_email text not null default '',
  due_date date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_items_status_updated_idx
  on public.studio_items (status, updated_at desc);

-- 5. Studio Ventures & Apps Display
create table if not exists public.ventures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  stage_label text not null default 'In build',
  headline text not null,
  summary text not null default '',
  url text not null default '',
  cta_label text not null default '',
  image_src text not null default '',
  image_alt text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  status text not null check (status in ('live', 'building', 'research', 'archived')) default 'building',
  featured boolean not null default false,
  sort_order integer not null default 10,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ventures_published_order_idx
  on public.ventures (published, sort_order asc, created_at asc);

-- Enable Row-Level Security on every table.
alter table public.posts enable row level security;
alter table public.cohorts enable row level security;
alter table public.applications enable row level security;
alter table public.studio_items enable row level security;
alter table public.ventures enable row level security;

-- Public anon policies: read-only on published posts, visible cohorts, and published ventures.
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "Public can read active cohorts" on public.cohorts;
create policy "Public can read active cohorts"
  on public.cohorts for select
  to anon, authenticated
  using (status in ('open', 'upcoming'));

drop policy if exists "Public can read published ventures" on public.ventures;
create policy "Public can read published ventures"
  on public.ventures for select
  to anon, authenticated
  using (published = true);

-- Applications and studio_items are private; accessed strictly server-side
-- via SUPABASE_SERVICE_ROLE_KEY after allowlist verification.

-- Seed initial 2026-27 Cohort
insert into public.cohorts (
  slug, title, window_label, summary, terms, roles, status
) values (
  'cohort-2026-27',
  'Cohort 2026–27',
  'Rolling · 8–12 weeks',
  'Small 2–4 person part-time cohorts working beside founders on open research questions and software builds. Internships are unpaid; contributors finish with published co-authored work, a certificate, and a letter of recommendation.',
  '[
    {"label":"Format","value":"8–12 weeks · Unpaid · Certificate & LOR"},
    {"label":"Schedule","value":"10–25 hrs/week · Remote or Bengaluru"},
    {"label":"Selection","value":"Application → 20-min call → 4-hr work sample"}
  ]'::jsonb,
  '[
    {
      "id":"research",
      "number":"01",
      "title":"Research",
      "focus":"Visits, operator interviews, and competitor teardowns.",
      "workSample":"",
      "commitment":"10–20 hrs/wk",
      "stipend":"Unpaid"
    },
    {
      "id":"design-and-build",
      "number":"02",
      "title":"Design & build",
      "focus":"Interface flows, prototypes, and front-end work.",
      "workSample":"4-hr brief: simplify one dense operator screen or build a small local-state web utility with CSV export.",
      "commitment":"15–25 hrs/wk",
      "stipend":"Unpaid"
    },
    {
      "id":"growth-and-distribution",
      "number":"03",
      "title":"Growth & distribution",
      "focus":"Merchant outreach, onboarding, and pricing tests.",
      "workSample":"4-hr brief: write a plain-language merchant pitch and outline a five-shop field test.",
      "commitment":"10–20 hrs/wk",
      "stipend":"Unpaid"
    }
  ]'::jsonb,
  'open'
)
on conflict (slug) do nothing;

-- Seed initial parchi. venture
insert into public.ventures (
  slug, name, stage_label, headline, summary, url, cta_label, image_src, image_alt, highlights, status, featured, sort_order, published
) values (
  'parchi',
  'parchi.',
  'First venture',
  'Simple counter billing for busy retail shops.',
  'Offline-first point of sale, barcode price tagging, and daily cash reconciliation for Indian apparel, footwear, and retail stores.',
  'https://parchi-pos.vercel.app/',
  'Open parchi.',
  '/parchi-preview.png',
  'parchi. point-of-sale web application showing counter billing and thermal receipt workflow',
  '[
    "Runs offline on the counter computer with local storage and instant JSON/CSV exports.",
    "Handles size × colour variants, 80mm thermal receipts, UPI QR, and optional GSTIN billing.",
    "Prints Code128 barcode hangtags on 50×25mm thermal rolls and 24-up A4 sheets."
  ]'::jsonb,
  'live',
  true,
  1,
  true
)
on conflict (slug) do nothing;
