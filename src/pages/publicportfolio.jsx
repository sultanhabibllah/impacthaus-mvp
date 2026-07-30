import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseclient'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PublicPortfolio() {
  const { slug } = useParams()
  const [volunteerName, setVolunteerName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [entries, setEntries] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPortfolio()
  }, [slug])

  async function loadPortfolio() {
    setLoading(true)

    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('volunteer_id')
      .eq('public_slug', slug)
      .maybeSingle()

    if (!portfolio) {
      setNotFound(true)
      setLoading(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', portfolio.volunteer_id)
      .single()

    setVolunteerName(profileData?.full_name || '')
    setAvatarUrl(profileData?.avatar_url || '')

    const { data: entryData } = await supabase
      .from('portfolio_entries')
      .select('*')
      .eq('volunteer_id', portfolio.volunteer_id)
      .order('completed_at', { ascending: false })

    setEntries(entryData || [])
    setLoading(false)
  }

  if (loading) {
    return <p className="page">Loading portfolio...</p>
  }

  if (notFound) {
    return <p className="page">Portfolio not found.</p>
  }

  const initials = volunteerName
    ? volunteerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="page">
      <div className="card portfolio-header">
        <div className="portfolio-header-info">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="portfolio-avatar" />
          ) : (
            <div className="portfolio-avatar-placeholder">{initials}</div>
          )}
          <div>
            <h1>{volunteerName}'s Impact Portfolio</h1>
            <p className="portfolio-subtext">
              {entries.length} verified engagement{entries.length === 1 ? '' : 's'} on ImpactHaus
            </p>
          </div>
        </div>
      </div>

      {entries.length === 0 && <p>No completed engagements yet.</p>}

      {entries.map((entry) => (
        <div key={entry.engagement_id} className="card">
          <div className="portfolio-entry">
            <div>
              <h2>{entry.role}</h2>
              <p className="opp-meta-line" style={{ margin: 0 }}>
                <strong>{entry.organization_name}</strong>
                {entry.cause_area && <> · {entry.cause_area}</>}
              </p>
              <p className="portfolio-entry-meta">
                {formatDate(entry.started_at)} to {formatDate(entry.completed_at)}
              </p>
            </div>
            <span className="pill pill-completed">Verified</span>
          </div>
        </div>
      ))}
    </div>
  )
}