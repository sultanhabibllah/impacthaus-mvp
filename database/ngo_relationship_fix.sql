alter table opportunities
add constraint opportunities_ngo_details_fkey
foreign key (ngo_id) references ngo_details(profile_id);