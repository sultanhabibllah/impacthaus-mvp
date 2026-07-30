import { useEffect, useState } from 'react'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [ngos, setNgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadNgos()
    }
  }, [profile])

  async function loadNgos() {
    setLoading(true)

    const { data, error: fetchError } = await supabase
      .from('ngo_details')
      .select('profile_id, org_name, sector, country, description, verified, profiles ( email, created_at )')
      .order('org_name')

    if (!fetchError) {
      setNgos(data)
    }

    setLoading(false)
  }

  async function toggleVerified(ngo) {
    setError('')

    const { error: updateError } = await supabase
      .from('ngo_details')
      .update({ verified: !ngo.verified })
      .eq('profile_id', ngo.profile_id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    loadNgos()
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  if (profile.role !== 'admin') {
    return <p className="page">You don't have permission to view this page.</p>
  }

  if (loading) {
    return <p className="page">Loading organizations...</p>
  }

  return (
    <div className="page">
      <h1>NGO Verification</h1>
      <p style={{ color: 'var(--color-text-muted)' }}>
        Review registered organizations and mark them as verified. Verified organizations show a badge across the platform.
      </p>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {ngos.map((ngo) => (
        <div key={ngo.profile_id} className="card">
          <div className="opp-card-header">
            <h2>{ngo.org_name}</h2>
            <span className={`pill ${ngo.verified ? 'pill-completed' : 'pill-pending'}`}>
              {ngo.verified ? 'Verified' : 'Unverified'}
            </span>
          </div>

          <p className="opp-meta-line">
            {ngo.sector} · {ngo.country} · {ngo.profiles?.email}
          </p>

          <p>{ngo.description}</p>

          <button type="button" onClick={() => toggleVerified(ngo)}>
            {ngo.verified ? 'Remove verification' : 'Mark as verified'}
          </button>
        </div>
      ))}
    </div>
  )
}