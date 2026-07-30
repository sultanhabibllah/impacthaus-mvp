create table cause_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into cause_areas (name) values
  ('Education'),
  ('Health'),
  ('Environment'),
  ('Economic Empowerment'),
  ('Human Rights'),
  ('Community Development'),
  ('Youth Development'),
  ('Technology and Innovation');

alter table opportunities
add column cause_area_id uuid references cause_areas(id);

create table volunteer_interests (
  volunteer_id uuid references profiles(id) on delete cascade,
  cause_area_id uuid references cause_areas(id) on delete cascade,
  primary key (volunteer_id, cause_area_id)
);

alter table cause_areas enable row level security;
alter table volunteer_interests enable row level security;

create policy "cause areas viewable by authenticated users"
on cause_areas for select to authenticated using (true);

create policy "volunteer interests viewable by authenticated users"
on volunteer_interests for select to authenticated using (true);

create policy "volunteers manage their own interests"
on volunteer_interests for insert to authenticated with check (auth.uid() = volunteer_id);

create policy "volunteers remove their own interests"
on volunteer_interests for delete to authenticated using (auth.uid() = volunteer_id);

create index idx_opportunities_cause_area on opportunities(cause_area_id);