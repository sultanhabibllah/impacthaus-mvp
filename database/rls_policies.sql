create policy "profiles are viewable by authenticated users"
on profiles for select to authenticated using (true);

create policy "users can insert their own profile"
on profiles for insert to authenticated with check (auth.uid() = id);

create policy "users can update their own profile"
on profiles for update to authenticated using (auth.uid() = id);

create policy "volunteer details viewable by authenticated users"
on volunteer_details for select to authenticated using (true);

create policy "volunteers manage their own details"
on volunteer_details for insert to authenticated with check (auth.uid() = profile_id);

create policy "volunteers update their own details"
on volunteer_details for update to authenticated using (auth.uid() = profile_id);

create policy "ngo details viewable by authenticated users"
on ngo_details for select to authenticated using (true);

create policy "ngos manage their own details"
on ngo_details for insert to authenticated with check (auth.uid() = profile_id);

create policy "ngos update their own details"
on ngo_details for update to authenticated using (auth.uid() = profile_id);

create policy "skills viewable by authenticated users"
on skills for select to authenticated using (true);

create policy "authenticated users can add skills"
on skills for insert to authenticated with check (true);

create policy "volunteer skills viewable by authenticated users"
on volunteer_skills for select to authenticated using (true);

create policy "volunteers manage their own skills"
on volunteer_skills for insert to authenticated with check (auth.uid() = volunteer_id);

create policy "volunteers remove their own skills"
on volunteer_skills for delete to authenticated using (auth.uid() = volunteer_id);

create policy "opportunities viewable by authenticated users"
on opportunities for select to authenticated using (true);

create policy "ngos create their own opportunities"
on opportunities for insert to authenticated with check (auth.uid() = ngo_id);

create policy "ngos update their own opportunities"
on opportunities for update to authenticated using (auth.uid() = ngo_id);

create policy "opportunity skills viewable by authenticated users"
on opportunity_skills for select to authenticated using (true);

create policy "ngos manage required skills on their own opportunities"
on opportunity_skills for insert to authenticated
with check (exists (select 1 from opportunities o where o.id = opportunity_id and o.ngo_id = auth.uid()));

create policy "ngos remove required skills on their own opportunities"
on opportunity_skills for delete to authenticated
using (exists (select 1 from opportunities o where o.id = opportunity_id and o.ngo_id = auth.uid()));

create policy "volunteers view their own applications"
on applications for select to authenticated using (auth.uid() = volunteer_id);

create policy "ngos view applications to their own opportunities"
on applications for select to authenticated
using (exists (select 1 from opportunities o where o.id = opportunity_id and o.ngo_id = auth.uid()));

create policy "volunteers submit applications"
on applications for insert to authenticated with check (auth.uid() = volunteer_id);

create policy "ngos update status of applications to their opportunities"
on applications for update to authenticated
using (exists (select 1 from opportunities o where o.id = opportunity_id and o.ngo_id = auth.uid()));

create policy "involved parties view their engagements"
on engagements for select to authenticated
using (exists (
  select 1 from applications a
  join opportunities o on o.id = a.opportunity_id
  where a.id = application_id and (a.volunteer_id = auth.uid() or o.ngo_id = auth.uid())
));

create policy "ngos create engagements on accepted applications"
on engagements for insert to authenticated
with check (exists (
  select 1 from applications a
  join opportunities o on o.id = a.opportunity_id
  where a.id = application_id and o.ngo_id = auth.uid()
));

create policy "involved parties update engagement status"
on engagements for update to authenticated
using (exists (
  select 1 from applications a
  join opportunities o on o.id = a.opportunity_id
  where a.id = application_id and (a.volunteer_id = auth.uid() or o.ngo_id = auth.uid())
));

create policy "involved parties view engagement history"
on engagement_status_log for select to authenticated
using (exists (
  select 1 from engagements e
  join applications a on a.id = e.application_id
  join opportunities o on o.id = a.opportunity_id
  where e.id = engagement_id and (a.volunteer_id = auth.uid() or o.ngo_id = auth.uid())
));

create policy "portfolios are publicly viewable"
on portfolios for select to anon, authenticated using (true);

create policy "volunteers create their own portfolio"
on portfolios for insert to authenticated with check (auth.uid() = volunteer_id);

create policy "volunteers update their own portfolio"
on portfolios for update to authenticated using (auth.uid() = volunteer_id);

create or replace function log_engagement_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into engagement_status_log (engagement_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger engagement_status_change
after insert or update on engagements
for each row
execute function log_engagement_status_change();