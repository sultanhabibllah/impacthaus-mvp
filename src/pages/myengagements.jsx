import { useEffect, useState } from 'react'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysBetween(start, end) {
  const diff = Math.floor((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24))
  return diff < 1 ? 'Same day' : `${diff} day${diff === 1 ? '' : 's'}`
}

const TABS = ['all', 'active', 'completed', 'cancelled']

export default function MyEngagements() {
  const { user, profile } = useAuth()
  const [engagements, setEngagements] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadEngagements()
    }
  }, [user])

  async function loadEngagements() {
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('engagements')
      .select(
        `
        id,
        status,
        started_at,
        completed_at,
        applications (
          volunteer_id,
          profiles ( full_name, avatar_url ),
          opportunities (
            title,
            ngo_id,
            ngo_details ( org_name )
          )
        )
        `
      )
      .order('started_at', { ascending: false })

    if (!fetchError) {
      setEngagements(data)
    }

    setLoading(false)
  }

  async function handleStatusChange(engagementId, newStatus) {
    setError('')

    const updates = { status: newStatus }
    if (newStatus === 'completed') {
      updates.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('engagements')
      .update(updates)
      .eq('id', engagementId)

    if (updateError) {
      setError(updateError.message)
      return
    }

    loadEngagements()
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  if (profile.role === 'admin') {
    return <p className="page">Engagements aren't part of the admin role.</p>
  }

  if (loading) {
    return <p className="page">Loading engagements...</p>
  }

  const isNgo = profile.role === 'ngo'
  const filtered = activeTab === 'all' ? engagements : engagements.filter((e) => e.status === activeTab)

  return (
    <div className="page">
      <h1>My Engagements</h1>

      <div className="status-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`status-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab !== 'all' && ` (${engagements.filter((e) => e.status === tab).length})`}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {filtered.length === 0 && <p>No engagements here yet.</p>}

      {filtered.map((eng) => {
        const volunteerName = eng.applications?.profiles?.full_name
        const initials = volunteerName
          ? volunteerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
          : '?'

        return (
          <div key={eng.id} className="card">
            <h2>{eng.applications?.opportunities?.title}</h2>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 0 }}>
              {eng.applications?.opportunities?.ngo_details?.org_name}
            </p>

            {isNgo && (
              <div className="mini-avatar-row">
                {eng.applications?.profiles?.avatar_url ? (
                  <img src={eng.applications.profiles.avatar_url} alt="" className="mini-avatar" />
                ) : (
                  <div className="mini-avatar-placeholder">{initials}</div>
                )}
                <span className="mini-avatar-name">{volunteerName}</span>
              </div>
            )}

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              Started {formatDate(eng.started_at)}
              {eng.status === 'completed' && eng.completed_at && (
                <> · Completed {formatDate(eng.completed_at)} · {daysBetween(eng.started_at, eng.completed_at)}</>
              )}
            </p>

            <span className={`pill pill-${eng.status}`}>{eng.status}</span>

            {eng.status === 'active' && (
              <div className="card-actions">
                <button onClick={() => handleStatusChange(eng.id, 'completed')}>
                  Mark completed
                </button>
                <button type="button" onClick={() => handleStatusChange(eng.id, 'cancelled')}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}