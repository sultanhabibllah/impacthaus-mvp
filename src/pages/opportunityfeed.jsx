import { useEffect, useState } from 'react'
import { supabase } from '../supabaseclient'
import { useAuth } from '../context/authcontext'
import OpportunityCard from '../components/opportunitycard'

export default function OpportunityFeed() {
  const { profile } = useAuth()
  const [opportunities, setOpportunities] = useState([])
  const [causeAreas, setCauseAreas] = useState([])
  const [applicantCounts, setApplicantCounts] = useState({})
  const [ngoPostCounts, setNgoPostCounts] = useState({})
  const [locationFilter, setLocationFilter] = useState('all')
  const [skillFilter, setSkillFilter] = useState('')
  const [causeAreaFilter, setCauseAreaFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCauseAreas()
    loadOpportunities()
  }, [])

  async function loadCauseAreas() {
    const { data } = await supabase.from('cause_areas').select('*').order('name')
    setCauseAreas(data || [])
  }

  async function loadOpportunities() {
    setLoading(true)

    const { data, error } = await supabase
      .from('opportunities')
      .select(
        `
        id,
        title,
        description,
        time_commitment,
        location_type,
        cause_area_id,
        created_at,
        ngo_id,
        ngo_details ( org_name, country, verified ),
        cause_areas ( name ),
        opportunity_skills ( skills ( name ) )
        `
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error || !data) {
      setLoading(false)
      return
    }

    setOpportunities(data)

    const counts = {}
    await Promise.all(
      data.map(async (opp) => {
        const { count } = await supabase
          .from('applications')
          .select('*', { count: 'exact', head: true })
          .eq('opportunity_id', opp.id)
        counts[opp.id] = count || 0
      })
    )
    setApplicantCounts(counts)

    const uniqueNgoIds = [...new Set(data.map((opp) => opp.ngo_id))]
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

    setLoading(false)
  }

  const filtered = opportunities.filter((opp) => {
    const matchesLocation =
      locationFilter === 'all' || opp.location_type === locationFilter

    const skillNames = opp.opportunity_skills.map((os) => os.skills.name.toLowerCase())
    const matchesSkill =
      skillFilter.trim() === '' ||
      skillNames.some((name) => name.includes(skillFilter.trim().toLowerCase()))

    const matchesCauseArea =
      causeAreaFilter === 'all' || opp.cause_area_id === causeAreaFilter

    return matchesLocation && matchesSkill && matchesCauseArea
  })

  if (profile?.role === 'admin') {
    return <p className="page">Opportunity browsing isn't part of the admin role.</p>
  }

  if (loading) {
    return <p className="page">Loading opportunities...</p>
  }

  return (
    <div className="page">
      <h1>Opportunities</h1>

      <div className="filters">
        <label>
          Cause area
          <select value={causeAreaFilter} onChange={(e) => setCauseAreaFilter(e.target.value)}>
            <option value="all">All</option>
            {causeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Location
          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="remote">Remote</option>
            <option value="in_person">In person</option>
          </select>
        </label>

        <label>
          Skill
          <input
            type="text"
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            placeholder="e.g. Design"
          />
        </label>
      </div>

      <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>
        {filtered.length} opportunit{filtered.length === 1 ? 'y' : 'ies'}
      </p>

      {filtered.length === 0 && <p>No opportunities match your filters.</p>}

      {filtered.map((opp) => (
        <OpportunityCard
          key={opp.id}
          opportunity={opp}
          applicantCount={applicantCounts[opp.id] ?? 0}
          ngoPostCount={ngoPostCounts[opp.ngo_id] ?? 1}
        />
      ))}
    </div>
  )
}