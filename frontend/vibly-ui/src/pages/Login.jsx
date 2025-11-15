import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { isProfileComplete } from "../utils/profileCheck";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    setLoading(true);
    
    // Add a small delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const res = await axios.post(
        "http://localhost:5001/api/user/login",
        { email, password }
      );

      localStorage.setItem("userId", res.data.userId);
      
      // Check if profile is complete
      try {
        const userRes = await axios.get(`http://localhost:5001/api/user/${res.data.userId}`);
        const user = userRes.data;
        
        // Smooth transition before navigation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (isProfileComplete(user)) {
          navigate("/match-list");
        } else {
          navigate("/profile");
        }
      } catch (userErr) {
        console.error("Error fetching user after login:", userErr);
        await new Promise(resolve => setTimeout(resolve, 200));
        navigate("/profile");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden flex items-center justify-center px-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs - Mouse Following */}
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            top: `${mousePosition.y * 0.5}%`,
            left: `${mousePosition.x * 0.5}%`,
            transition: "all 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            top: `${100 - mousePosition.y * 0.5}%`,
            right: `${100 - mousePosition.x * 0.5}%`,
            transition: "all 0.3s ease-out",
            animationDelay: "1s",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-pink-500 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{
            bottom: `${mousePosition.y * 0.3}%`,
            left: `${50 + mousePosition.x * 0.2}%`,
            transition: "all 0.3s ease-out",
            animationDelay: "2s",
          }}
        />

        {/* Floating Particles */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg md:max-w-md lg:max-w-lg animate-fadeInUp px-4 sm:px-6">
        {/* Logo/Title */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-block transform hover:scale-105 transition-transform duration-300">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Vibly
            </h1>
          </Link>
          <p className="text-lg sm:text-xl text-purple-200 font-light">Welcome Back</p>
        </div>

        {/* Login Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
          
          {/* Glassmorphism Card */}
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10">
            <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
              {/* Email Input */}
              <div className="group">
                <label className="block text-white/90 text-sm sm:text-base font-semibold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <label className="block text-white/90 text-sm sm:text-base font-semibold mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg rounded-xl bg-white/5 text-white placeholder-white/40 border border-white/20 focus:border-purple-400 focus:bg-white/10 focus:ring-2 focus:ring-purple-400/30 focus:outline-none transition-all duration-300"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm animate-shake">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-base sm:text-lg">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </span>
                {/* Shine effect */}
                {!loading && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                )}
                {/* Loading overlay */}
                {loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse"></div>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-4 bg-transparent text-white/60">New to Vibly?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 font-semibold transition-all duration-300 group transform hover:scale-105"
              >
                <span className="text-sm sm:text-base">Create an account</span>
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Landing */}
        <div className="text-center mt-4 sm:mt-6">
          <Link
            to="/"
            className="text-white/60 hover:text-white/90 text-xs sm:text-sm transition-all duration-300 inline-flex items-center gap-1 group transform hover:scale-105"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to home</span>
          </Link>
        </div>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
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
        
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
