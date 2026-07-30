create extension if not exists "pgcrypto";

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text check (role in ('volunteer', 'ngo', 'admin') or role is null),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table volunteer_details (
  profile_id uuid primary key references profiles(id) on delete cascade,
  location text,
  bio text
);

create table ngo_details (
  profile_id uuid primary key references profiles(id) on delete cascade,
  org_name text not null,
  sector text not null,
  country text not null,
  description text
);

create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text
);

create table volunteer_skills (
  volunteer_id uuid references profiles(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  proficiency text check (proficiency in ('beginner', 'intermediate', 'advanced', 'expert')),
  primary key (volunteer_id, skill_id)
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  time_commitment text,
  location_type text not null check (location_type in ('remote', 'in_person')),
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create table opportunity_skills (
  opportunity_id uuid references opportunities(id) on delete cascade,
  skill_id uuid references skills(id) on delete cascade,
  primary key (opportunity_id, skill_id)
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  volunteer_id uuid not null references profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (opportunity_id, volunteer_id)
);

create table engagements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references applications(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_by uuid references profiles(id),
  updated_at timestamptz not null default now()
);

create table engagement_status_log (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references engagements(id) on delete cascade,
  status text not null,
  changed_by uuid references profiles(id),
  changed_at timestamptz not null default now()
);

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null unique references profiles(id) on delete cascade,
  public_slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_opportunities_status on opportunities(status);
create index idx_applications_opportunity on applications(opportunity_id);
create index idx_applications_volunteer on applications(volunteer_id);
create index idx_engagements_status on engagements(status);
create index idx_portfolios_slug on portfolios(public_slug);