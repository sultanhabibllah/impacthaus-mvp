import { useEffect, useState } from 'react'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'
import jsPDF from 'jspdf'

function generateSlug(fullName) {
  const base = fullName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const random = Math.random().toString(36).slice(2, 8)
  return `${base}-${random}`
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MyPortfolio() {
  const { user, profile } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [entries, setEntries] = useState([])
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      loadPortfolio()
    }
  }, [user, profile])

  async function loadPortfolio() {
    setLoading(true)

    let { data: existing } = await supabase
      .from('portfolios')
      .select('*')
      .eq('volunteer_id', user.id)
      .maybeSingle()

    if (!existing) {
      const slug = generateSlug(profile.full_name)
      const { data: created } = await supabase
        .from('portfolios')
        .insert({ volunteer_id: user.id, public_slug: slug })
        .select('*')
        .single()

      existing = created
    }

    setPortfolio(existing)

    const { data: entryData } = await supabase
      .from('portfolio_entries')
      .select('*')
      .eq('volunteer_id', user.id)
      .order('completed_at', { ascending: false })

    setEntries(entryData || [])
    setLoading(false)
  }

  function handleExportPdf() {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text(`${profile.full_name}'s Impact Portfolio`, 14, 20)

    let y = 35
    doc.setFontSize(12)

    entries.forEach((entry) => {
      doc.text(`${entry.role} — ${entry.organization_name}`, 14, y)
      y += 7
      const dates = `${new Date(entry.started_at).toLocaleDateString()} to ${new Date(entry.completed_at).toLocaleDateString()}`
      doc.text(dates, 14, y)
      y += 12
    })

    doc.save(`${profile.full_name}-impact-portfolio.pdf`)
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <p className="page">Loading your portfolio...</p>
  }

  const publicUrl = `${window.location.origin}/portfolio/${portfolio.public_slug}`

  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="page">
      <div className="card portfolio-header">
        <div className="portfolio-header-info">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="portfolio-avatar" />
          ) : (
            <div className="portfolio-avatar-placeholder">{initials}</div>
          )}
          <div>
            <h1>{profile.full_name}'s Impact Portfolio</h1>
            <p className="portfolio-subtext">{entries.length} verified engagement{entries.length === 1 ? '' : 's'}</p>
            <div className="portfolio-link-row">
              <a href={publicUrl}>{publicUrl}</a>
              <button type="button" className="copy-btn" onClick={handleCopyLink}>
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleExportPdf}>Download as PDF</button>
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