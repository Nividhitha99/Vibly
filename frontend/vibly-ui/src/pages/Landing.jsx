import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isNavigating, setIsNavigating] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
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
        {[...Array(20)].map((_, i) => (
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
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">
        {/* Logo/Title with Animation */}
        <div className="text-center mb-16 animate-fadeInUp">
          <div className="relative inline-block">
            <h1 className="text-8xl md:text-9xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient relative z-10">
              Vibely
            </h1>
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 blur-2xl opacity-30 animate-pulse"></div>
          </div>
          <div className="w-32 h-1.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mx-auto rounded-full mt-4 shadow-lg shadow-purple-500/50"></div>
          <p className="text-lg text-purple-200 mt-4 font-light tracking-wider">Where Entertainment Meets Connection</p>
        </div>

        {/* Main Heading */}
        <div className="text-center mb-8 sm:mb-12 max-w-5xl animate-fadeInUp animation-delay-200 px-4">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
            Connect Through
            <span className="block mt-2 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-gradient">
              Shared Passions
            </span>
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
            Discover meaningful connections based on your favorite movies, music, and TV shows.
            <br className="hidden sm:block" />
            <span className="text-purple-300 font-semibold mt-2 inline-block">Find your vibe, find your people.</span>
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-6xl w-full animate-fadeInUp animation-delay-400 px-4">
          <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 relative overflow-hidden cursor-pointer active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-300">🎬</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Movie Magic</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">Match through shared cinematic tastes and discover your next favorite film together</p>
            </div>
          </div>
          <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 relative overflow-hidden cursor-pointer active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-300">🎵</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Musical Harmony</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">Connect over your favorite beats and create playlists that tell your story</p>
            </div>
          </div>
          <div className="group bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/30 relative overflow-hidden cursor-pointer active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-6 transform group-hover:scale-110 transition-transform duration-300">📺</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">TV Together</h3>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">Bond over binge-worthy shows and plan your next watch party</p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={async () => {
            setIsNavigating(true);
            // Smooth transition before navigation
            await new Promise(resolve => setTimeout(resolve, 300));
            navigate("/login");
          }}
          disabled={isNavigating}
          className="group relative px-12 sm:px-16 py-5 sm:py-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full text-white text-xl sm:text-2xl font-bold overflow-hidden transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 animate-fadeInUp animation-delay-600 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 active:scale-105"
        >
          <span className="relative z-10 flex items-center gap-3 sm:gap-4">
            {isNavigating ? (
              <>
                <svg className="animate-spin h-6 w-6 sm:h-7 sm:w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="tracking-wide">Loading...</span>
              </>
            ) : (
              <>
                <span className="tracking-wide">Explore</span>
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 transform group-hover:translate-x-3 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </span>
          {/* Animated gradient overlay */}
          {!isNavigating && (
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          )}
          {/* Shine effect */}
          {!isNavigating && (
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          )}
          {/* Loading pulse */}
          {isNavigating && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse"></div>
          )}
        </button>
        
        {/* Additional Info */}
        <p className="text-gray-400 mt-6 sm:mt-8 text-xs sm:text-sm animate-fadeInUp animation-delay-800 px-4">
          Join thousands finding their perfect match through shared interests
        </p>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
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
        
        .animate-fadeInUp {
          animation: fadeInUp 1s ease-out forwards;
          opacity: 0;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-800 {
          animation-delay: 0.8s;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}

export default Landing;

