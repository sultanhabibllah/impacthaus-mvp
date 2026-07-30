import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseclient'
import AuthLayout from '../components/authlayout'

export default function SignUp() {
  const navigate = useNavigate()
  const [role, setRole] = useState('volunteer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/complete-profile')
  }

  async function handleGoogleSignUp() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
  }

  const headline =
    role === 'ngo'
      ? 'Find skilled volunteers who show up.'
      : 'Turn your skills into verified impact.'

  const subtext =
    role === 'ngo'
      ? 'Post your project and connect with capable volunteers across Africa, ready to contribute real skills.'
      : 'Join skilled young Africans building professional, credentialed experience through meaningful volunteer work.'

  return (
    <AuthLayout headline={headline} subtext={subtext}>
      <form onSubmit={handleSubmit}>
        <h1>Create an account</h1>

        <label>
          I am a:
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="volunteer">Volunteer</option>
            <option value="ngo">NGO</option>
          </select>
        </label>

        <label>
          Full name / Organization name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </label>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account...' : 'Sign up'}
        </button>

        <div style={{ margin: '1rem 0' }}>
          <button type="button" onClick={handleGoogleSignUp} style={{ width: '100%' }}>
            Continue with Google
          </button>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}