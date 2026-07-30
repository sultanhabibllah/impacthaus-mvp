import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'
import OpportunityCard from '../components/opportunitycard'

const OPP_FIELDS = `
  id, title, description, time_commitment, location_type, cause_area_id, created_at, ngo_id,
  ngo_details ( org_name, country, verified ),
  cause_areas ( name ),
  opportunity_skills ( skills ( name ) )
`

export default function Home() {
  const { user, profile } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [applicantCounts, setApplicantCounts] = useState({})
  const [ngoPostCounts, setNgoPostCounts] = useState({})
  const [stats, setStats] = useState({ primary: 0, secondary: 0 })
  const [completeness, setCompleteness] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      loadContent()
    }
  }, [user, profile])

  async function loadCounts(opps) {
    const counts = {}
    await Promise.all(
      opps.map(async (opp) => {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('opportunity_id', opp.id)
        counts[opp.id] = count || 0
      })
    )
    setApplicantCounts(counts)

    const uniqueNgoIds = [...new Set(opps.map((opp) => opp.ngo_id))]
    const ngoCounts = {}
    await Promise.all(
      uniqueNgoIds.map(async (ngoId) => {
        const { count } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('ngo_id', ngoId)
        ngoCounts[ngoId] = count || 0
      })
    )
    setNgoPostCounts(ngoCounts)
  }

  async function loadContent() {
    setLoading(true)

    if (profile.role === 'volunteer') {
      await loadVolunteerContent()
    } else if (profile.role === 'ngo') {
      await loadNgoContent()
    }

    setLoading(false)
  }

  async function loadVolunteerContent() {
    const { data: volunteerDetails } = await supabase
      .from('volunteer_details')
      .select('bio')
      .eq('profile_id', user.id)
      .maybeSingle()

    const { count: skillCount } = await supabase
      .from('volunteer_skills')
      .select('*', { count: 'exact', head: true })
      .eq('volunteer_id', user.id)

    const { data: interests } = await supabase
      .from('volunteer_interests')
      .select('cause_area_id')
      .eq('volunteer_id', user.id)

    const causeAreaIds = (interests || []).map((i) => i.cause_area_id)

    const factorsFilled = [
      !!profile.avatar_url,
      !!volunteerDetails?.bio,
      (skillCount || 0) > 0 || causeAreaIds.length > 0,
    ].filter(Boolean).length

    setCompleteness(Math.round((factorsFilled / 3) * 100))

    let query = supabase
      .from('opportunities')
      .select(OPP_FIELDS)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3)

    if (causeAreaIds.length > 0) {
      query = query.in('cause_area_id', causeAreaIds)
    }

    const { data } = await query
    setOpportunities(data || [])
    if (data && data.length > 0) await loadCounts(data)

    const { count: completedCount } = await supabase
      .from('portfolio_entries')
      .select('*', { count: 'exact', head: true })
      .eq('volunteer_id', user.id)

    const { count: pendingCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('volunteer_id', user.id)
      .eq('status', 'pending')

    setStats({ primary: completedCount || 0, secondary: pendingCount || 0 })
  }

  async function loadNgoContent() {
    const { data: ngoDetails } = await supabase
      .from('ngo_details')
      .select('description')
      .eq('profile_id', user.id)
      .maybeSingle()

    const { data } = await supabase
      .from('opportunities')
      .select(OPP_FIELDS)
      .eq('ngo_id', user.id)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3)

    setOpportunities(data || [])
    if (data && data.length > 0) await loadCounts(data)

    const { data: myOpportunities } = await supabase
      .from('opportunities')
      .select('id')
      .eq('ngo_id', user.id)

    const opportunityIds = (myOpportunities || []).map((o) => o.id)

    const factorsFilled = [
      !!profile.avatar_url,
      !!ngoDetails?.description,
      opportunityIds.length > 0,
    ].filter(Boolean).length

    setCompleteness(Math.round((factorsFilled / 3) * 100))

    let pendingCount = 0
    if (opportunityIds.length > 0) {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('opportunity_id', opportunityIds)
        .eq('status', 'pending')

      pendingCount = count || 0
    }

    setStats({ primary: opportunityIds.length, secondary: pendingCount })
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  const isVolunteer = profile.role === 'volunteer'
  const firstName = profile.full_name.split(' ')[0]

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const ringStyle = {
    background: `conic-gradient(white ${completeness}%, rgba(255,255,255,0.28) 0)`,
  }

  return (
    <div>
      <div className="home-hero">
        <div className="home-hero-inner">
          <div>
            <p className="hero-greeting">Welcome back</p>
            <div className="hero-stat-number">{stats.primary}</div>
            <p className="hero-stat-label">
              {isVolunteer
                ? `Verified engagement${stats.primary === 1 ? '' : 's'}, ${firstName}`
                : `Open opportunit${stats.primary === 1 ? 'y' : 'ies'} posted`}
            </p>
            <p className="hero-subtext">
              {isVolunteer
                ? `${stats.secondary} application${stats.secondary === 1 ? '' : 's'} waiting on a response`
                : `${stats.secondary} application${stats.secondary === 1 ? '' : 's'} awaiting your review`}
            </p>
          </div>

          <div className="hero-ring-wrap" style={ringStyle}>
            <div className="hero-ring-inner">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                <span className="hero-ring-placeholder">{initials}</span>
              )}
            </div>
            <span className="hero-ring-label">{completeness}% complete</span>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: '2.5rem' }}>
        <div className="action-grid">
          {isVolunteer ? (
            <>
              <Link to="/opportunities" className="action-tile">
                <span className="action-tile-title">Browse opportunities</span>
                <span className="action-tile-desc">Find volunteer work matched to your skills</span>
              </Link>
              <Link to="/engagements" className="action-tile">
                <span className="action-tile-title">My engagements</span>
                <span className="action-tile-desc">Track your active and completed work</span>
              </Link>
              <Link to="/my-portfolio" className="action-tile">
                <span className="action-tile-title">My portfolio</span>
                <span className="action-tile-desc">View and share your verified impact</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/post-opportunity" className="action-tile">
                <span className="action-tile-title">Post an opportunity</span>
                <span className="action-tile-desc">Find skilled volunteers for your project</span>
              </Link>
              <Link to="/applications" className="action-tile">
                <span className="action-tile-title">Review applications</span>
                <span className="action-tile-desc">See who's applied to your postings</span>
              </Link>
              <Link to="/engagements" className="action-tile">
                <span className="action-tile-title">Engagements</span>
                <span className="action-tile-desc">Manage active volunteer work</span>
              </Link>
            </>
          )}
        </div>

        <div className="section-heading">
          <h2>{isVolunteer ? 'Recommended for you' : 'Your open opportunities'}</h2>
          <Link to="/opportunities">
            {isVolunteer ? 'See all opportunities →' : 'Manage all →'}
          </Link>
        </div>

        {loading && <p>Loading...</p>}

        {!loading && opportunities.length === 0 && (
          <p>
            {isVolunteer
              ? 'No matching opportunities yet, browse the full feed to find one.'
              : "You don't have any open opportunities yet."}
          </p>
        )}

        {opportunities.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opportunity={opp}
            applicantCount={applicantCounts[opp.id] ?? 0}
            ngoPostCount={ngoPostCounts[opp.ngo_id] ?? 1}
          />
        ))}
      </div>
    </div>
  )
}