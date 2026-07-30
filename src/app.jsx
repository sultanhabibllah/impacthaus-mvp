import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom'
import { useAuth } from './context/authcontext'
import Navbar from './components/navbar'
import SignUp from './pages/signup'
import Login from './pages/login'
import ResetPassword from './pages/resetpassword'
import UpdatePassword from './pages/updatepassword'
import ChooseRole from './pages/chooserole'
import CompleteProfile from './pages/completeprofile'
import EditProfile from './pages/editprofile'
import Home from './pages/home'
import OpportunityFeed from './pages/opportunityfeed'
import PostOpportunity from './pages/postopportunity'
import OpportunityDetail from './pages/opportunitydetail'
import EditOpportunity from './pages/editopportunity'
import ReviewApplications from './pages/reviewapplications'
import MyEngagements from './pages/myengagements'
import MyPortfolio from './pages/myportfolio'
import PublicPortfolio from './pages/publicportfolio'
import VolunteerProfile from './pages/volunteerprofile'
import AdminDashboard from './pages/admindashboard'

const noNavRoutes = ['/login', '/signup', '/reset-password', '/update-password']

function LoggedOutLanding() {
  return (
    <div className="home-hero">
      <div className="home-hero-inner">
        <h1>Turn skills into verified impact.</h1>
        <p>
          ImpactHaus connects skilled volunteers with NGOs across Africa.{' '}
          <Link to="/signup" style={{ color: 'white', textDecoration: 'underline' }}>
            Sign up
          </Link>{' '}
          to get started.
        </p>
      </div>
    </div>
  )
}

function App() {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  const hideNav = noNavRoutes.includes(location.pathname)

  if (!loading && user && profile && !profile.role) {
    return <ChooseRole />
  }

  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/opportunities" element={<OpportunityFeed />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/opportunities/:id/edit" element={<EditOpportunity />} />
        <Route path="/post-opportunity" element={<PostOpportunity />} />
        <Route path="/applications" element={<ReviewApplications />} />
        <Route path="/engagements" element={<MyEngagements />} />
        <Route path="/my-portfolio" element={<MyPortfolio />} />
        <Route path="/portfolio/:slug" element={<PublicPortfolio />} />
        <Route path="/volunteers/:id" element={<VolunteerProfile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="/"
          element={
            !user ? (
              <LoggedOutLanding />
            ) : profile?.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Home />
            )
          }
        />
      </Routes>
    </>
  )
}

export default App