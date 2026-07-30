import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'
import AuthLayout from '../components/authlayout'

export default function ChooseRole() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('volunteer')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/complete-profile')
  }

  return (
    <AuthLayout
      headline="One quick thing."
      subtext="Tell us how you'll be using ImpactHaus so we can set up the right experience for you."
    >
      <form onSubmit={handleSubmit}>
        <h1>How will you use ImpactHaus?</h1>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
          <input
            type="radio"
            name="role"
            value="volunteer"
            checked={role === 'volunteer'}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: 'auto' }}
          />
          I'm a volunteer looking to contribute my skills
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
          <input
            type="radio"
            name="role"
            value="ngo"
            checked={role === 'ngo'}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: 'auto' }}
          />
          I'm an NGO looking for skilled volunteers
        </label>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </AuthLayout>
  )
}