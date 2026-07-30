import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseclient'

export default function VolunteerProfile() {
  const { id } = useParams()
  const [profile, setProfile] = useState(null)
  const [details, setDetails] = useState(null)
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [portfolioSlug, setPortfolioSlug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [id])

  async function loadProfile() {
    setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url, role')
      .eq('id', id)
      .maybeSingle()

    if (!profileData || profileData.role !== 'volunteer') {
      setNotFound(true)
      setLoading(false)
      return
    }

    setProfile(profileData)

    const { data: detailsData } = await supabase
      .from('volunteer_details')
      .select('location, bio')
      .eq('profile_id', id)
      .maybeSingle()

    setDetails(detailsData)

    const { data: skillsData } = await supabase
      .from('volunteer_skills')
      .select('proficiency, skills ( name )')
      .eq('volunteer_id', id)

    setSkills(skillsData || [])

    const { data: interestsData } = await supabase
      .from('volunteer_interests')
      .select('cause_areas ( name )')
      .eq('volunteer_id', id)

    setInterests(interestsData || [])

    const { data: portfolioData } = await supabase
      .from('portfolios')
      .select('public_slug')
      .eq('volunteer_id', id)
      .maybeSingle()

    setPortfolioSlug(portfolioData?.public_slug || null)

    setLoading(false)
  }

  if (loading) {
    return <p className="page">Loading profile...</p>
  }

  if (notFound) {
    return <p className="page">Profile not found.</p>
  }

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
            <h1>{profile.full_name}</h1>
            <p className="portfolio-subtext">
              {details?.location} · {profile.email}
            </p>
          </div>
        </div>

        {portfolioSlug && (
          <Link to={`/portfolio/${portfolioSlug}`}>View impact portfolio →</Link>
        )}
      </div>

      {details?.bio && (
        <div className="card">
          <h2>About</h2>
          <p>{details.bio}</p>
        </div>
      )}

      <div className="card">
        <h2>Skills</h2>
        {skills.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No skills listed yet.</p>}
        <div className="opp-tags-row">
          {skills.map((s) => (
            <span key={s.skills.name} className="tag tag-skill">
              {s.skills.name} · {s.proficiency}
            </span>
          ))}
        </div>
      </div>

      {interests.length > 0 && (
        <div className="card">
          <h2>Causes they care about</h2>
          <div className="opp-tags-row">
            {interests.map((i) => (
              <span key={i.cause_areas.name} className="badge-cause">
                {i.cause_areas.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}