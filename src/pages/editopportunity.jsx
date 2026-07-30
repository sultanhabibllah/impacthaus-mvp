import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

export default function EditOpportunity() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [opportunity, setOpportunity] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [locationType, setLocationType] = useState('remote')
  const [causeAreas, setCauseAreas] = useState([])
  const [causeAreaId, setCauseAreaId] = useState('')
  const [notAuthorized, setNotAuthorized] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCauseAreas()
    loadOpportunity()
  }, [id])

  async function loadCauseAreas() {
    const { data } = await supabase.from('cause_areas').select('*').order('name')
    setCauseAreas(data || [])
  }

  async function loadOpportunity() {
    setLoading(true)

    const { data } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (!data || data.ngo_id !== user.id) {
      setNotAuthorized(true)
      setLoading(false)
      return
    }

    setOpportunity(data)
    setTitle(data.title)
    setDescription(data.description)
    setTimeCommitment(data.time_commitment || '')
    setLocationType(data.location_type)
    setCauseAreaId(data.cause_area_id || '')
    setLoading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error: updateError } = await supabase
      .from('opportunities')
      .update({
        title,
        description,
        time_commitment: timeCommitment,
        location_type: locationType,
        cause_area_id: causeAreaId,
      })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    navigate(`/opportunities/${id}`)
  }

  async function handleClose() {
    setError('')
    setSaving(true)

    const { error: closeError } = await supabase
      .from('opportunities')
      .update({ status: 'closed' })
      .eq('id', id)

    if (closeError) {
      setError(closeError.message)
      setSaving(false)
      return
    }

    setSaving(false)
    navigate('/opportunities')
  }

  if (loading) {
    return <p className="page">Loading...</p>
  }

  if (notAuthorized) {
    return <p className="page">You don't have permission to edit this opportunity.</p>
  }

  return (
    <div className="page">
      <form onSubmit={handleSave} className="form-wide">
        <h1>Edit opportunity</h1>

        <span className={`pill pill-${opportunity.status}`} style={{ marginBottom: '1.5rem', display: 'inline-block' }}>
          {opportunity.status}
        </span>

        <div className="form-section-label">The basics</div>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </label>

        <label>
          Cause area
          <select value={causeAreaId} onChange={(e) => setCauseAreaId(e.target.value)}>
            {causeAreas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </select>
        </label>

        <div className="form-section-label">Commitment</div>

        <div className="form-row">
          <label>
            Estimated time commitment
            <input
              type="text"
              value={timeCommitment}
              onChange={(e) => setTimeCommitment(e.target.value)}
            />
          </label>

          <label>
            Location type
            <select value={locationType} onChange={(e) => setLocationType(e.target.value)}>
              <option value="remote">Remote</option>
              <option value="in_person">In person</option>
            </select>
          </label>
        </div>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ marginTop: '0.5rem' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      <div className="form-wide">
        {opportunity.status === 'open' && (
          <button type="button" onClick={handleClose} disabled={saving}>
            Close this opportunity
          </button>
        )}

        {opportunity.status === 'closed' && <p>This opportunity is closed.</p>}
      </div>
    </div>
  )
}