import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseclient'
import AuthLayout from '../components/authlayout'

export default function UpdatePassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => navigate('/login'), 2000)
  }

  return (
    <AuthLayout
      headline="Almost there."
      subtext="Choose a new password to get back into your account."
    >
      {success ? (
        <p>Password updated. Redirecting to login...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <h1>Set a new password</h1>

          <label>
            New password
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
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}