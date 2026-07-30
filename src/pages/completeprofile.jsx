import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

export default function CompleteProfile() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [skillName, setSkillName] = useState('')
  const [proficiency, setProficiency] = useState('beginner')
  const [causeAreas, setCauseAreas] = useState([])
  const [selectedInterests, setSelectedInterests] = useState([])

  const [orgName, setOrgName] = useState('')
  const [sector, setSector] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCauseAreas()
  }, [])

  async function loadCauseAreas() {
    const { data } = await supabase.from('cause_areas').select('*').order('name')
    setCauseAreas(data || [])
  }

  function toggleInterest(id) {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  async function handleVolunteerSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: detailsError } = await supabase
      .from('volunteer_details')
      .insert({ profile_id: user.id, location, bio })

    if (detailsError) {
      setError(detailsError.message)
      setLoading(false)
      return
    }

    if (skillName.trim()) {
      const { data: existingSkill } = await supabase
        .from('skills')
        .select('id')
        .eq('name', skillName.trim())
        .maybeSingle()

      let skillId = existingSkill?.id

      if (!skillId) {
        const { data: newSkill, error: skillError } = await supabase
          .from('skills')
          .insert({ name: skillName.trim() })
          .select('id')
          .single()

        if (skillError) {
          setError(skillError.message)
          setLoading(false)
          return
        }

        skillId = newSkill.id
      }

      const { error: linkError } = await supabase
        .from('volunteer_skills')
        .insert({ volunteer_id: user.id, skill_id: skillId, proficiency })

      if (linkError) {
        setError(linkError.message)
        setLoading(false)
        return
      }
    }

    for (const causeAreaId of selectedInterests) {
      await supabase
        .from('volunteer_interests')
        .insert({ volunteer_id: user.id, cause_area_id: causeAreaId })
    }

    setLoading(false)
    navigate('/')
  }

  async function handleNgoSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: detailsError } = await supabase
      .from('ngo_details')
      .insert({
        profile_id: user.id,
        org_name: orgName,
        sector,
        country,
        description,
      })

    if (detailsError) {
      setError(detailsError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/')
  }

  if (profile.role === 'volunteer') {
    return (
      <div className="page">
        <form onSubmit={handleVolunteerSubmit} className="form-wide">
          <h1>Complete your volunteer profile</h1>

          <div className="form-section-label">About you</div>

          <div className="form-row">
            <label>
              Location
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kigali, Rwanda"
                required
              />
            </label>
          </div>

          <label>
            Short bio
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A couple sentences about you." />
          </label>

          <div className="form-section-label">Your skills</div>

          <div className="form-row">
            <label>
              A skill you bring
              <input
                type="text"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g. Graphic Design"
              />
            </label>

            <label>
              Proficiency
              <select value={proficiency} onChange={(e) => setProficiency(e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </label>
          </div>

          <fieldset className="chip-select">
            <legend>Causes you care about</legend>
            {causeAreas.map((area) => (
              <label key={area.id}>
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(area.id)}
                  onChange={() => toggleInterest(area.id)}
                />
                {area.name}
              </label>
            ))}
          </fieldset>

          {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="page">
      <form onSubmit={handleNgoSubmit} className="form-wide">
        <h1>Complete your organization profile</h1>

        <div className="form-section-label">Organization details</div>

        <label>
          Organization name
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
        </label>

        <div className="form-row">
          <label>
            Sector
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="e.g. Environment, Public Health"
              required
            />
          </label>

          <label>
            Country
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does your organization do?"
          />
        </label>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}