import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const navigate = useNavigate();
  const { verifyOTP, resendOTP, isVerifyingOTP, pendingEmail, otpResendTimer } = useAuthStore();

  useEffect(() => {
    // Redirect if no pending email
    if (!pendingEmail) {
      navigate('/signup');
    }
  }, [pendingEmail, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, value) => {
    const newOtp = [...otp];

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleResend = async () => {
    try {
      await resendOTP();
      setTimeLeft(600); // reset timer to 10 minutes
      toast.success('OTP resent successfully!');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    await verifyOTP(otpString);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 relative overflow-hidden bg-[#0d1117] text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 left-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl animate-pulse-slow-delayed"></div>
      </div>

      {/* Left Column - OTP Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8 bg-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/10">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-7 h-7 text-blue-400" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Verify Email</h1>
              <p className="text-gray-400 text-sm">We&apos;ve sent a 6-digit code to</p>
              <p className="text-blue-400 font-medium break-all">{pendingEmail}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Fields */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-300">Enter OTP</label>
              <div className="flex gap-3 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-semibold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn w-full rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-none h-11 font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              disabled={isVerifyingOTP}
            >
              {isVerifyingOTP ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Resend OTP */}
          <div className="text-center pt-4 border-t border-white/10">
            {timeLeft > 0 ? (
              <p className="text-gray-400 text-sm">
                Resend OTP in{' '}
                <span className="text-blue-400 font-medium">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-blue-400 hover:underline text-sm font-medium transition-colors"
              >
                Didn&apos;t receive code? Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Placeholder */}
      <div className="hidden lg:flex flex-col justify-center items-center p-12 relative z-10">
        <div className="text-center space-y-6 max-w-md">
          <div className="inline-block p-4 bg-blue-500/10 rounded-2xl">
            <Mail className="w-12 h-12 text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold text-white">Check Your Email</h2>
          <p className="text-gray-400">
            We&apos;ve sent a verification code to your email address. Enter it above to verify your
            account.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
