import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

export default function PostOpportunity() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeCommitment, setTimeCommitment] = useState('')
  const [locationType, setLocationType] = useState('remote')
  const [skillsInput, setSkillsInput] = useState('')
  const [causeAreas, setCauseAreas] = useState([])
  const [causeAreaId, setCauseAreaId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCauseAreas()
  }, [])

  async function loadCauseAreas() {
    const { data } = await supabase.from('cause_areas').select('*').order('name')
    setCauseAreas(data || [])
    if (data && data.length > 0) {
      setCauseAreaId(data[0].id)
    }
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  if (profile.role !== 'ngo') {
    return <p className="page">Only NGO accounts can post opportunities.</p>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: opportunity, error: opportunityError } = await supabase
      .from('opportunities')
      .insert({
        ngo_id: user.id,
        title,
        description,
        time_commitment: timeCommitment,
        location_type: locationType,
        cause_area_id: causeAreaId,
      })
      .select('id')
      .single()

    if (opportunityError) {
      setError(opportunityError.message)
      setLoading(false)
      return
    }

    const skillNames = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    for (const name of skillNames) {
      const { data: existingSkill } = await supabase
        .from('skills')
        .select('id')
        .eq('name', name)
        .maybeSingle()

      let skillId = existingSkill?.id

      if (!skillId) {
        const { data: newSkill, error: skillError } = await supabase
          .from('skills')
          .insert({ name })
          .select('id')
          .single()

        if (skillError) {
          setError(skillError.message)
          setLoading(false)
          return
        }

        skillId = newSkill.id
      }

      await supabase
        .from('opportunity_skills')
        .insert({ opportunity_id: opportunity.id, skill_id: skillId })
    }

    setLoading(false)
    navigate('/opportunities')
  }

  return (
    <div className="page">
      <form onSubmit={handleSubmit} className="form-wide">
        <h1>Post an opportunity</h1>

        <div className="form-section-label">The basics</div>

        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design our annual impact report"
            required
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will the volunteer be doing, and why does it matter?"
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
              placeholder="e.g. 5 hours/week for 2 months"
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

        <div className="form-section-label">Skills needed</div>

        <label>
          Required skills
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            placeholder="e.g. Graphic Design, Copywriting"
          />
          <span className="helper-text">Separate multiple skills with commas.</span>
        </label>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Posting...' : 'Post opportunity'}
        </button>
      </form>
    </div>
  )
}