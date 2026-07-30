import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authcontext'
import { supabase } from '../supabaseclient'

export default function Navbar() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand" end>ImpactHaus</NavLink>

      <div className="navbar-links">
        {user ? (
          <>
            <NavLink to="/opportunities">Opportunities</NavLink>
            <NavLink to="/engagements">Engagements</NavLink>
            {profile?.role === 'volunteer' && (
              <NavLink to="/my-portfolio">My Portfolio</NavLink>
            )}
            {profile?.role === 'ngo' && (
              <>
                <NavLink to="/post-opportunity">Post an opportunity</NavLink>
                <NavLink to="/applications">Applications</NavLink>
              </>
            )}
            <NavLink to="/edit-profile">Edit profile</NavLink>

            <div className="navbar-user-group">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="navbar-avatar" />
              ) : (
                <div className="navbar-avatar-placeholder">{initials}</div>
              )}
              <span className="navbar-user">{profile?.full_name}</span>
              <button onClick={handleLogout}>Log out</button>
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/signup">Sign up</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}