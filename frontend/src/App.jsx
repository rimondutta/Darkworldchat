import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import PasswordUnlockModal from './components/PasswordUnlockModal'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore.js';
import { useThemeStore } from './store/useThemeStore.js';
import { Loader } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  // Global page fade-in variant
  const pageFade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.5, ease: 'easeOut' },
  };

  return (
    <div data-theme={theme} className="min-h-screen">
      
      <PasswordUnlockModal />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <motion.div {...pageFade}>
                {authUser ? <HomePage /> : <Navigate to="/login" />}
              </motion.div>
            }
          />
          <Route
            path="/signup"
            element={
              <motion.div {...pageFade}>
                {!authUser ? <SignUpPage /> : <Navigate to="/" />}
              </motion.div>
            }
          />
          <Route
            path="/login"
            element={
              <motion.div {...pageFade}>
                {!authUser ? <LoginPage /> : <Navigate to="/" />}
              </motion.div>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <motion.div {...pageFade}>
                {!authUser ? <OTPVerificationPage /> : <Navigate to="/" />}
              </motion.div>
            }
          />
          <Route
            path="/settings"
            element={
              <motion.div {...pageFade}>
                {authUser ? <SettingsPage /> : <Navigate to="/login" />}
              </motion.div>
            }
          />
          <Route
            path="/profile"
            element={
              <motion.div {...pageFade}>
                {authUser ? <ProfilePage /> : <Navigate to="/login" />}
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App;
