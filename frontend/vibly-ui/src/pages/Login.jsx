import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    
  try {
    const res = await axios.post(
      "http://localhost:5001/api/user/login",
      { email, password }
    );

    localStorage.setItem("userId", res.data.userId);
      navigate("/profile");
  } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-gradient-xy"></div>
      
      {/* Floating animated blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-500/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      
      {/* Particle bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-float"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12">
        {/* Big heading above everything */}
        <div className="text-center mb-12 lg:mb-16 animate-fade-in">
          <h1 className="text-7xl lg:text-8xl font-bold mb-4 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.02em' }}>
            Vibely
        </h1>
          <p className="text-2xl lg:text-3xl text-white/90 font-normal mb-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.01em' }}>
            Find Your OffScreen Pair!
          </p>
          <div className="flex items-center justify-center gap-3 text-white/70 text-lg animate-fade-in animation-delay-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            <span className="animate-bounce" style={{ animationDelay: '0s' }}>✨</span>
            <span className="animate-pulse">Welcome Back</span>
            <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>✨</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          
          {/* Centered Login Form */}
          <div className="w-full max-w-lg">
            <div className="relative">
              {/* Glowing effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
              
              {/* Glassmorphism card */}
              <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-10 lg:p-14 w-full max-w-lg animate-float-slow">

                <form onSubmit={handleLogin} className="space-y-7">
                  {/* Email Input */}
                  <div className="group">
                    <label className="block text-white/80 text-sm font-normal mb-2.5" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      Email
                    </label>
                    <div className="relative">
        <input
          type="email"
                        className="w-full px-5 py-4 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/10 focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 group-hover:border-white/20"
                        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                        placeholder="Enter your email"
                        value={email}
          onChange={(e) => setEmail(e.target.value)}
                        required
        />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="group">
                    <label className="block text-white/80 text-sm font-normal mb-2.5" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      Password
                    </label>
                    <div className="relative">
        <input
          type="password"
                        className="w-full px-5 py-4 rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/10 focus:border-blue-400/50 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 group-hover:border-white/20"
                        style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                        placeholder="Enter your password"
                        value={password}
          onChange={(e) => setPassword(e.target.value)}
                        required
        />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm"></div>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm animate-shake" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                      {error}
                    </div>
                  )}

                  {/* Login Button */}
        <button
                    type="submit"
                    className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 group"
                    style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
        >
                    <span className="relative z-10">Login</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
        </button>
                </form>

                {/* Sign up link */}
                <div className="mt-8 text-center">
                  <p className="text-white/60 text-sm" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
                    Don't have an account?{" "}
                    <Link 
                      to="/signup" 
                      className="text-blue-300 hover:text-blue-200 font-medium hover:underline transition-colors duration-200"
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                    >
            Sign up
                    </Link>
        </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom text with left-to-right animation */}
        <div className="mt-16 text-center overflow-hidden">
          <p className="text-white/80 text-3xl lg:text-4xl font-semibold animate-slide-in-left" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
            Connect with movies, music and more..
          </p>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes gradient-xy {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.8;
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(0.5deg);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
        
        @keyframes slide-in-left {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 15s ease infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 1.2s ease-out;
        }
        
        .animation-delay-500 {
          animation-delay: 0.5s;
        }
        
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
