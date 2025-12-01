import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import Footer from '../components/Footer';
import toast from 'react-hot-toast';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const { signup, isSigningUp } = useAuthStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Invalid email format');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      setPasswordError('Passwords do not match');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!validateForm()) return;

    try {
      await signup(formData);
      navigate('/verify-otp');
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Sign up failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <>
      <div
        className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 pt-20 overflow-hidden"
        style={{
          background: 'radial-gradient(circle at top, #1b0a0f 0%, #0f1419 100%)',
        }}
      >
        {/* Snowfall animation */}
        <div className="absolute inset-0 -z-10">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 5}s`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: `${8 + Math.random() * 12}px`,
              }}
            >
              ❄
            </div>
          ))}
        </div>

        {/* Neon grid overlay */}
        <div
          className="absolute inset-0 -z-20"
          style={{
            background:
              'repeating-linear-gradient(0deg, rgba(255,0,0,0.05) 0, rgba(255,0,0,0.05) 2px, transparent 2px, transparent 20px), repeating-linear-gradient(90deg, rgba(255,0,0,0.05) 0, rgba(255,0,0,0.05) 2px, transparent 2px, transparent 20px)',
          }}
        ></div>

        <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT SIDE - FORM */}
          <div className="flex flex-col justify-center max-w-md mx-auto w-full p-10 bg-[#1b0a0f]/70 rounded-2xl backdrop-blur-md border border-[#ff0040]/50 shadow-lg">
            <div className="text-center mb-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#ff0040]/20 flex items-center justify-center border border-[#ff0040]/50">
                  <User className="w-8 h-8 text-[#ff0040]" />
                </div>
                <h1 className="text-4xl font-bold text-[#ff0040]">Create Account</h1>
                <p className="text-gray-400 text-base">Join the Stranger Things vibe</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="peer w-full bg-[#2d1b2a] text-white rounded-xl border border-gray-700 focus:border-[#ff0040] focus:ring-2 focus:ring-[#ff0040]/50 pl-12 pr-4 py-3.5 outline-none placeholder-transparent"
                  required
                />
                <label className="absolute left-12 -top-2.5 text-[#ff0040] text-xs px-1 transition-all duration-200
                      peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2
                      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#ff0040] peer-focus:bg-transparent">
                  Full Name
                </label>
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="peer w-full bg-[#2d1b2a] text-white rounded-xl border border-gray-700 focus:border-[#ff0040] focus:ring-2 focus:ring-[#ff0040]/50 pl-12 pr-4 py-3.5 outline-none placeholder-transparent"
                  required
                />
                <label className="absolute left-12 -top-2.5 text-[#ff0040] text-xs px-1 transition-all duration-200
                      peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2
                      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#ff0040] peer-focus:bg-transparent">
                  Email
                </label>
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="peer w-full bg-[#2d1b2a] text-white rounded-xl border border-gray-700 focus:border-[#ff0040] focus:ring-2 focus:ring-[#ff0040]/50 pl-12 pr-12 py-3.5 outline-none placeholder-transparent"
                  required
                />
                <label className="absolute left-12 -top-2.5 text-[#ff0040] text-xs px-1 transition-all duration-200
                      peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2
                      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#ff0040] peer-focus:bg-transparent">
                  Password
                </label>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff0040] transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, confirmPassword: value });
                    if (formData.password && formData.password !== value) {
                      setPasswordError('Passwords do not match');
                    } else {
                      setPasswordError('');
                    }
                  }}
                  className={`peer w-full bg-[#2d1b2a] text-white rounded-xl border ${
                    passwordError ? 'border-red-500' : 'border-gray-700'
                  } focus:border-[#ff0040] focus:ring-2 ${
                    passwordError ? 'focus:ring-red-500/40' : 'focus:ring-[#ff0040]/50'
                  } pl-12 pr-12 py-3.5 outline-none placeholder-transparent`}
                  required
                />
                <label className="absolute left-12 -top-2.5 text-[#ff0040] text-xs px-1 transition-all duration-200
                      peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-placeholder-shown:-translate-y-1/2
                      peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#ff0040] peer-focus:bg-transparent">
                  Confirm Password
                </label>
                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff0040] transition"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {passwordError && <p className="text-red-400 text-sm -mt-2">{passwordError}</p>}

              <button
                type="submit"
                className="w-full bg-[#ff0040] hover:bg-[#ff3366] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSigningUp}
              >
                {isSigningUp ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-[#ff0040] hover:text-[#ff3366] font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* RIGHT SIDE - Decorative */}
          <div className="hidden lg:flex flex-col justify-center border-l border-gray-700 pl-12 pr-2">
            <div className="text-center text-[#ff0040]">
              <h2 className="text-3xl font-bold mb-4">Join the Hellfire Club</h2>
              <p className="text-gray-400">
                Enter the Upside Down with your new account. Join friends and explore the neon world.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Snowflake CSS */}
      <style>{`
        .snowflake {
          position: absolute;
          top: -10px;
          color: white;
          opacity: 0.6;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes fall {
          0% { transform: translateY(0); }
          100% { transform: translateY(120vh); }
        }
      `}</style>
    </>
  );
};

export default SignupPage;
