import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

function timeAgo(dateString) {
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000)
  const days = Math.floor(seconds / 86400)

  if (days === 0) return 'Posted today'
  if (days === 1) return 'Posted yesterday'
  if (days < 7) return `Posted ${days} days ago`
  if (days < 30) return `Posted ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`
  return `Posted ${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`
}

export default function OpportunityDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()

  const [opportunity, setOpportunity] = useState(null)
  const [ngoEmail, setNgoEmail] = useState('')
  const [applicantCount, setApplicantCount] = useState(0)
  const [ngoPostCount, setNgoPostCount] = useState(0)
  const [message, setMessage] = useState('')
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadOpportunity()
  }, [id])

  async function loadOpportunity() {
    setLoading(true)

    const { data } = await supabase
      .from('opportunities')
      .select(
        `
        id,
        title,
        description,
        time_commitment,
        location_type,
        ngo_id,
        status,
        created_at,
        ngo_details ( org_name, sector, country, description, verified ),
        cause_areas ( name ),
        opportunity_skills ( skills ( name ) )
        `
      )
      .eq('id', id)
      .single()

    setOpportunity(data)

    if (data) {
      const { count: appCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('opportunity_id', id)
      setApplicantCount(appCount || 0)

      const { count: postCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('ngo_id', data.ngo_id)
      setNgoPostCount(postCount || 0)

      const { data: ngoProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', data.ngo_id)
        .single()
      setNgoEmail(ngoProfile?.email || '')
    }

    if (user) {
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('opportunity_id', id)
        .eq('volunteer_id', user.id)
        .maybeSingle()

      setAlreadyApplied(!!existing)
    }

    setLoading(false)
  }

  async function handleApply(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error: applyError } = await supabase.from('applications').insert({
      opportunity_id: id,
      volunteer_id: user.id,
      message,
    })

    if (applyError) {
      setError(applyError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setAlreadyApplied(true)
    setApplicantCount((prev) => prev + 1)
    setSubmitting(false)
  }

  if (loading) {
    return <p className="page">Loading...</p>
  }

  if (!opportunity) {
    return <p className="page">Opportunity not found.</p>
  }

  const isOwner = user && opportunity.ngo_id === user.id
  const isVerified = opportunity.ngo_details?.verified

  return (
    <div className="page">
      <div className="card">
        <div className="opp-card-header">
          <h1 style={{ marginBottom: '0.3rem' }}>{opportunity.title}</h1>
          <span className="opp-posted">{timeAgo(opportunity.created_at)}</span>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <span className={`pill pill-${opportunity.status}`}>{opportunity.status}</span>
        </div>

        <p className="opp-meta-line">
          <strong>{opportunity.location_type === 'remote' ? 'Remote' : 'In person'}</strong>
          {' · '}
          {opportunity.cause_areas?.name}
          {' · '}
          {opportunity.time_commitment}
          {' · '}
          {applicantCount} applicant{applicantCount === 1 ? '' : 's'} so far
        </p>

        <p className="opp-description-full">{opportunity.description}</p>

        <div className="opp-tags-row">
          {opportunity.opportunity_skills.map((os) => (
            <span key={os.skills.name} className="tag tag-skill">{os.skills.name}</span>
          ))}
        </div>

        <div className="opp-footer">
          <span className={`opp-footer-item ${isVerified ? 'verified-badge' : ''}`}>
            {opportunity.ngo_details?.org_name}
            {!isVerified && ' (unverified)'}
          </span>
          <span className="opp-footer-item">{opportunity.ngo_details?.country}</span>
          <span className="opp-footer-item">
            {ngoPostCount} opportunit{ngoPostCount === 1 ? 'y' : 'ies'} posted
          </span>
        </div>

        {isOwner && (
          <div style={{ marginTop: '1rem' }}>
            <Link to={`/opportunities/${id}/edit`}>Edit this opportunity</Link>
          </div>
        )}
      </div>

      <div className="card">
        <h2>About {opportunity.ngo_details?.org_name}</h2>
        <p className="opp-meta-line">
          {opportunity.ngo_details?.sector} · {opportunity.ngo_details?.country}
        </p>
        <p>{opportunity.ngo_details?.description}</p>
        {ngoEmail && (
          <p style={{ marginTop: '0.75rem' }}>
            Contact: <a href={`mailto:${ngoEmail}`}>{ngoEmail}</a>
          </p>
        )}
      </div>

      {profile?.role === 'volunteer' && (
        <>
          {success && (
            <div className="card">
              <span className="pill pill-completed">Application submitted</span>
              <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                {opportunity.ngo_details?.org_name} will review your application and follow up.
              </p>
            </div>
          )}

          {alreadyApplied && !success && (
            <div className="card">
              <span className="pill pill-pending">Already applied</span>
            </div>
          )}

          {!alreadyApplied && !success && opportunity.status === 'open' && (
            <form onSubmit={handleApply}>
              <h2>Apply</h2>
              <label>
                Message to the organization
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain why you're a good fit for this opportunity."
                  required
                />
              </label>

              {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit application'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}