import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../supabaseclient'
import AuthLayout from '../components/authlayout'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/')
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
  }

  return (
    <AuthLayout
      headline="Welcome back."
      subtext="Log in to keep building verified impact, or find skilled volunteers for your next project."
    >
      <form onSubmit={handleSubmit}>
        <h1>Log in</h1>

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
          />
        </label>

        {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

        <button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p style={{ textAlign: 'center', margin: '1rem 0' }}>
          <Link to="/reset-password">Forgot password?</Link>
        </p>

        <button type="button" onClick={handleGoogleLogin} style={{ width: '100%' }}>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--color-text-muted)' }}>
          New to ImpactHaus? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </AuthLayout>
  )
}