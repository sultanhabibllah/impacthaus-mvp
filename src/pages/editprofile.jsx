import { useEffect, useState } from 'react'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

export default function EditProfile() {
  const { user, profile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [location, setLocation] = useState('')
  const [bio, setBio] = useState('')
  const [orgName, setOrgName] = useState('')
  const [sector, setSector] = useState('')
  const [country, setCountry] = useState('')
  const [description, setDescription] = useState('')

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      loadDetails()
    }
  }, [profile])

  async function loadDetails() {
    setFullName(profile.full_name)
    setAvatarUrl(profile.avatar_url || '')

    if (profile.role === 'volunteer') {
      const { data } = await supabase
        .from('volunteer_details')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (data) {
        setLocation(data.location || '')
        setBio(data.bio || '')
      }
    }

    if (profile.role === 'ngo') {
      const { data } = await supabase
        .from('ngo_details')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (data) {
        setOrgName(data.org_name || '')
        setSector(data.sector || '')
        setCountry(data.country || '')
        setDescription(data.description || '')
      }
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setUploading(false)
      return
    }

    setAvatarUrl(urlData.publicUrl)
    setUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    const { error: nameError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (nameError) {
      setError(nameError.message)
      setSaving(false)
      return
    }

    if (profile.role === 'volunteer') {
      const { error: detailsError } = await supabase
        .from('volunteer_details')
        .update({ location, bio })
        .eq('profile_id', user.id)

      if (detailsError) {
        setError(detailsError.message)
        setSaving(false)
        return
      }
    }

    if (profile.role === 'ngo') {
      const { error: detailsError } = await supabase
        .from('ngo_details')
        .update({ org_name: orgName, sector, country, description })
        .eq('profile_id', user.id)

      if (detailsError) {
        setError(detailsError.message)
        setSaving(false)
        return
      }
    }

    setSuccess(true)
    setSaving(false)
  }

  if (!profile) {
    return <p className="page">Loading...</p>
  }

  const initials = fullName
    ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="page">
      <form onSubmit={handleSave} className="form-wide">
        <h1>Edit profile</h1>

        <div className="avatar-upload">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="avatar-preview" />
          ) : (
            <div className="avatar-placeholder">{initials}</div>
          )}

          <div className="avatar-upload-controls">
            <label className="avatar-upload-label">
              {uploading ? 'Uploading...' : 'Change photo'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="form-section-label">Basic info</div>

        <label>
          Full name / Organization name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        {profile.role === 'volunteer' && (
          <>
            <label>
              Location
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </label>

            <label>
              Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
            </label>
          </>
        )}

        {profile.role === 'ngo' && (
          <>
            <div className="form-row">
              <label>
                Organization name
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </label>

              <label>
                Sector
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                />
              </label>
            </div>

            <label>
              Country
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </>
        )}

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
        {success && <p className="pill pill-completed">Profile updated</p>}

        <button type="submit" disabled={saving} style={{ marginTop: '0.5rem' }}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}