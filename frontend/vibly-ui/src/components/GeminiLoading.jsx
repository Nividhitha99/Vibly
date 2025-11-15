import React from "react";

function GeminiLoading({ message = "Gemini is finding your matches" }) {
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex flex-col items-center justify-center"
      style={{ 
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(-30px) scale(1.1) rotate(5deg);
            opacity: 0.95;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.98);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .gemini-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .gemini-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #ffffff 0%,
            #60a5fa 50%,
            #ffffff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        
        .sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="text-center px-6">
        {/* Gemini Logo/Icon with animated stars */}
        <div className="gemini-float mb-8 relative">
          {/* Gemini Logo - Using SVG representation of Gemini constellation */}
          <div className="relative flex items-center justify-center">
            <svg 
              width="200" 
              height="200" 
              viewBox="0 0 200 200" 
              className="gemini-float"
              style={{ filter: 'drop-shadow(0 0 30px rgba(96, 165, 250, 0.5))' }}
            >
              {/* Gemini constellation representation */}
              <g fill="none" stroke="url(#geminiGradient)" strokeWidth="3">
                {/* Twin stars representation */}
                <circle cx="70" cy="80" r="15" fill="url(#geminiGradient)" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="130" cy="80" r="15" fill="url(#geminiGradient)" opacity="0.9">
                  <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" begin="0.5s" repeatCount="indefinite" />
                </circle>
                {/* Connecting line */}
                <line x1="85" y1="80" x2="115" y2="80" strokeWidth="2" />
                {/* Additional stars */}
                <circle cx="50" cy="120" r="8" fill="url(#geminiGradient)" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="150" cy="120" r="8" fill="url(#geminiGradient)" opacity="0.7">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" begin="0.75s" repeatCount="indefinite" />
                </circle>
              </g>
              <defs>
                <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Sparkle effects around the logo */}
            <div className="absolute top-0 left-1/4 sparkle" style={{ animationDelay: '0s' }}>
              <span className="text-4xl">✨</span>
            </div>
            <div className="absolute top-0 right-1/4 sparkle" style={{ animationDelay: '0.5s' }}>
              <span className="text-4xl">✨</span>
            </div>
            <div className="absolute bottom-0 left-1/3 sparkle" style={{ animationDelay: '1s' }}>
              <span className="text-4xl">✨</span>
            </div>
            <div className="absolute bottom-0 right-1/3 sparkle" style={{ animationDelay: '1.5s' }}>
              <span className="text-4xl">✨</span>
            </div>
          </div>
        </div>
        
        {/* Message with shimmer effect */}
        <div className="gemini-pulse">
          <h2 className="text-4xl font-bold mb-6 shimmer-text">
            {message}
          </h2>
          
          {/* Animated dots */}
          <div className="flex justify-center gap-3 mt-6">
            <div 
              className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0s', animationDuration: '1.4s' }}
            ></div>
            <div 
              className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0.2s', animationDuration: '1.4s' }}
            ></div>
            <div 
              className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" 
              style={{ animationDelay: '0.4s', animationDuration: '1.4s' }}
            ></div>
          </div>
          
          {/* Subtitle */}
          <p className="text-gray-400 mt-8 text-lg">
            Analyzing your preferences and finding perfect matches...
          </p>
        </div>
      </div>
    </div>
  );
}

export default GeminiLoading;

