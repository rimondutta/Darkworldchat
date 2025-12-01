import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  const { login, isLoggingIn } = useAuthStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const validateForm = () => {
    if (!formData.email.trim()) return toast.error('Email is required');
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error('Invalid email format');
    if (!formData.password) return toast.error('Password is required');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await login(formData);
      navigate('/');
    } catch (err) {}
  };

  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

        {/* Animated Stranger Things Background */}
        <div className="absolute inset-0">
          {/* Red Aura Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#360000,black_75%)] opacity-90"></div>

          {/* Fog Overlay */}
          <div className="absolute inset-0 bg-[url('')] opacity-40 animate-pulse-slow"></div>
          <div className="absolute inset-0 bg-[url('')] opacity-30 animate-pulse-slow-delayed"></div>

          {/* VHS Grain */}
          <div className="absolute inset-0 mix-blend-soft-light opacity-[0.08] bg-[url('')]"></div>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 p-6">

          {/* LEFT SIDE - FORM */}
          <div className="max-w-md mx-auto w-full">

            <div className="text-center mb-10">
              <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center
                bg-[#1b0a0f]/20
                shadow-[0_0_40px_#ff000033]">
  <img src="/hellfire-club-strength-things-seeklogo.png" alt="Hellfire Club" className="w-10 h-10 object-contain" />
</div>


                <h1 className="text-4xl font-extrabold text-red-500 tracking-widest drop-shadow-[0_0_10px_#ff0000]">
                  HELLFIRE CLUB
                </h1>
                <p className="text-gray-400">Enter the Upside Down</p>
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  className="peer w-full bg-black/40 text-white rounded-xl border border-red-800 focus:border-red-500 focus:ring-2 focus:ring-red-700/40 transition-all pl-12 pr-4 py-3.5 outline-none"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="peer w-full bg-black/40 text-white rounded-xl border border-red-800 focus:border-red-500 focus:ring-2 focus:ring-red-700/40 transition-all pl-12 pr-12 py-3.5 outline-none"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />

                <button
                  type="button"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-red-700 hover:bg-red-600 text-white py-3 rounded-xl font-semibold shadow-[0_0_20px_#ff000055] transition-all flex items-center justify-center"
              >
                {isLoggingIn ? <Loader2 className="animate-spin" /> : 'Enter'}
              </button>

              {/* Signup link */}
              <p className="text-center text-gray-400 text-sm">
                Not a member?{' '}
                <Link
                  to="/signup"
                  className="text-red-500 hover:text-red-400 underline"
                >
                  Join the Hellfire Club
                </Link>
              </p>

            </form>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden lg:flex items-center justify-center">
            <img
              src="/hellfire-club-strength-things-seeklogo.png"
              alt="Stranger Things Logo"
              className="w-80 opacity-80 drop-shadow-[0_0_20px_#ff000033]"
            />
          </div>

        </div>
      </div>
    </>
  );
};

export default LoginPage;
