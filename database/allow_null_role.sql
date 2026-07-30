alter table profiles
drop constraint profiles_role_check;

alter table profiles
add constraint profiles_role_check
check (role in ('volunteer', 'ngo', 'admin') or role is null);