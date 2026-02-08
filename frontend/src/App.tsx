import './App.css'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Challenge from './pages/Challenge';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';
import Learn from './pages/Learn';
import LoginPage from './pages/LoginPage';
import Pronunciation from './pages/Pronunciation';
import RegisterPage from './pages/RegisterPage';
import PrivateRoute from './components/PrivateRoute';
import { AnimatePresence } from "framer-motion"
import { useAuth } from "./hooks/useAuth";
import LandingPage from "./pages/LandingPage";
import MainContent from './components/layout/MainContent';
import AboutUs from './pages/AboutUs';
import Speak from './pages/Speak';
import AuthCallback from './components/AuthCallback';
import Review from './pages/Review';
import Inbox from './pages/Inbox';
import Achievements from './pages/Achievements';

export default function App() {
  const location = useLocation()
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        {/* public */}
        <Route path="/" element={
          user ? <Navigate to="/home" replace /> : <LandingPage />
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} /> { }

        {/* protected */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/home" element={<MainContent />} />
            <Route path="/challenge" element={<Challenge />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/speak" element={<Speak />} />
            <Route path="/review" element={<Review />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/pronunciation" element={<Pronunciation />} />
            <Route path="/aboutus" element={<AboutUs />} />
          </Route>
        </Route>
        <Route path="/learn" element={<Learn />} />
      </Routes>
    </AnimatePresence>
  )
}
