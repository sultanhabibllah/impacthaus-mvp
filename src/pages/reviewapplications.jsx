import { useEffect, useState } from 'react'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  const days = Math.floor(seconds / 86400)

  if (days === 0) return 'Applied today'
  if (days === 1) return 'Applied yesterday'
  if (days < 7) return `Applied ${days} days ago`
  return `Applied ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
}

const TABS = ['all', 'pending', 'accepted', 'declined']

export default function ReviewApplications() {
  const { user, profile } = useAuth()
  const [applications, setApplications] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadApplications()
    }
  }, [user])

  async function loadApplications() {
    setLoading(true)

    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, title')
      .eq('ngo_id', user.id)

    const opportunityIds = (opportunities || []).map((o) => o.id)

    if (opportunityIds.length === 0) {
      setApplications([])
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('applications')
      .select(
        `
        id,
        message,
        status,
        created_at,
        opportunity_id,
        opportunities ( title ),
        profiles (
          full_name,
          email,
          avatar_url,
          volunteer_details ( location, bio ),
          volunteer_skills ( proficiency, skills ( name ) )
        )
        `
      )
      .in('opportunity_id', opportunityIds)
      .order('created_at', { ascending: false })

    if (!fetchError) {
      setApplications(data)
    }

    setLoading(false)
  }

  async function handleDecision(application, decision) {
    setError('')

    const { error: updateError } = await supabase
      .from('applications')
      .update({ status: decision })
      .eq('id', application.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    if (decision === 'accepted') {
      const { error: engagementError } = await supabase
        .from('engagements')
        .insert({ application_id: application.id })

      if (engagementError) {
        setError(engagementError.message)
        return
      }
    }

    loadApplications()
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  if (profile.role !== 'ngo') {
    return <p className="page">Only NGO accounts can review applications.</p>
  }

  if (loading) {
    return <p className="page">Loading applications...</p>
  }

  const filtered = activeTab === 'all' ? applications : applications.filter((a) => a.status === activeTab)

  return (
    <div className="page">
      <h1>Applications received</h1>

      <div className="status-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`status-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'all' && ` (${applications.filter((a) => a.status === tab).length})`}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {filtered.length === 0 && <p>No applications here yet.</p>}

      {filtered.map((app) => {
        const initials = app.profiles?.full_name
          ? app.profiles.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
          : '?'

        return (
          <div key={app.id} className="card">
            <div className="opp-card-header">
              <h2>{app.opportunities?.title}</h2>
              <span className="opp-posted">{timeAgo(app.created_at)}</span>
            </div>

            <div className="mini-avatar-row">
              {app.profiles?.avatar_url ? (
                <img src={app.profiles.avatar_url} alt="" className="mini-avatar" />
              ) : (
                <div className="mini-avatar-placeholder">{initials}</div>
              )}
              <div>
                <span className="mini-avatar-name">{app.profiles?.full_name}</span>
                <span className="mini-avatar-sub">
                  {app.profiles?.volunteer_details?.location} · {app.profiles?.email}
                </span>
              </div>
            </div>

            {app.profiles?.volunteer_details?.bio && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {app.profiles.volunteer_details.bio}
              </p>
            )}

            {app.profiles?.volunteer_skills?.length > 0 && (
              <div className="opp-tags-row">
                {app.profiles.volunteer_skills.map((vs) => (
                  <span key={vs.skills.name} className="tag tag-skill">
                    {vs.skills.name} · {vs.proficiency}
                  </span>
                ))}
              </div>
            )}

            <p className="message-quote">"{app.message}"</p>

            <span className={`pill pill-${app.status}`}>{app.status}</span>

            {app.status === 'pending' && (
              <div className="card-actions">
                <button onClick={() => handleDecision(app, 'accepted')}>Accept</button>
                <button type="button" onClick={() => handleDecision(app, 'declined')}>Decline</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}