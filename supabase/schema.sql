-- ============================================
-- DAWN DOCS - Database Schema
-- ============================================

-- Common tables (shared across DAWN SERIES)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  user_id uuid,
  name text not null,
  email text not null,
  role text default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

-- Docs-specific tables
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text not null,
  created_at timestamptz default now()
);

create table pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id),
  parent_id uuid references pages(id),
  title text not null,
  content jsonb,
  is_public boolean default false,
  created_by uuid references staff(id),
  updated_by uuid references staff(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references pages(id),
  content jsonb,
  created_by uuid references staff(id),
  created_at timestamptz default now()
);

-- Row Level Security
alter table organizations enable row level security;
alter table staff enable row level security;
alter table contacts enable row level security;
alter table workspaces enable row level security;
alter table pages enable row level security;
alter table page_versions enable row level security;

-- Policies for staff
create policy "Staff can view own org" on staff
  for select using (auth.uid() = user_id);

create policy "Staff can insert own record" on staff
  for insert with check (auth.uid() = user_id);

-- Policies for organizations
create policy "Org members can view" on organizations
  for select using (
    id in (select organization_id from staff where user_id = auth.uid())
  );

create policy "Anyone can create org" on organizations
  for insert with check (true);

-- Policies for contacts
create policy "Org members can manage contacts" on contacts
  for all using (
    organization_id in (select organization_id from staff where user_id = auth.uid())
  );

-- Policies for workspaces
create policy "Org members can manage workspaces" on workspaces
  for all using (
    organization_id in (select organization_id from staff where user_id = auth.uid())
  );

-- Policies for pages
create policy "Workspace members can manage pages" on pages
  for all using (
    workspace_id in (
      select w.id from workspaces w
      join staff s on s.organization_id = w.organization_id
      where s.user_id = auth.uid()
    )
  );

create policy "Public pages are readable by anyone" on pages
  for select using (is_public = true);

-- Policies for page_versions
create policy "Workspace members can manage versions" on page_versions
  for all using (
    page_id in (
      select p.id from pages p
      join workspaces w on w.id = p.workspace_id
      join staff s on s.organization_id = w.organization_id
      where s.user_id = auth.uid()
    )
  );
