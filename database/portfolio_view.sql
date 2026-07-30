create view portfolio_entries as
select
  p.volunteer_id,
  e.id as engagement_id,
  o.title as role,
  nd.org_name as organization_name,
  e.started_at,
  e.completed_at,
  ca.name as cause_area
from engagements e
join applications a on a.id = e.application_id
join opportunities o on o.id = a.opportunity_id
join ngo_details nd on nd.profile_id = o.ngo_id
left join cause_areas ca on ca.id = o.cause_area_id
join portfolios p on p.volunteer_id = a.volunteer_id
where e.status = 'completed';

alter view portfolio_entries set (security_invoker = on);