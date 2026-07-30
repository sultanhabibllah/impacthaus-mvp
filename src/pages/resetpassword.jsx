import { useState } from 'react'
import { supabase } from '../supabaseclient'
import AuthLayout from '../components/authlayout'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <AuthLayout
      headline="Let's get you back in."
      subtext="Enter your email and we'll send you a link to reset your password."
    >
      {sent ? (
        <p>Check your email for a password reset link.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <h1>Reset your password</h1>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}