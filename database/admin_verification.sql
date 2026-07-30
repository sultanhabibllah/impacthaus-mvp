alter table ngo_details
add column verified boolean not null default false;

create policy "admins update ngo verification status"
on ngo_details for update
to authenticated
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);