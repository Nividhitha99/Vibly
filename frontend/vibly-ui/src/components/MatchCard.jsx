import React from "react";
import { useNavigate } from "react-router-dom";

function MatchCard({ match }) {
  const navigate = useNavigate();

  return (
    <div className="bg-gray-800 p-5 rounded-lg shadow-lg flex flex-col gap-3 hover:bg-gray-700 transition cursor-pointer">
      
      <h2 className="text-xl font-semibold">{match.name}</h2>
      
      <p className="text-blue-400">
        Compatibility Score: {((match.score || 0) * 100).toFixed(1)}%
      </p>

      {match.commonTastes && match.commonTastes.length > 0 && (
        <div className="text-sm text-gray-300">
          <p className="font-semibold mb-1">Common Tastes:</p>
          <ul className="list-disc ml-5">
            {match.commonTastes.map((t, index) => (
              <li key={index}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => navigate(`/match-profile/${match.userId}`)}
        className="bg-blue-600 py-2 rounded mt-auto hover:bg-blue-700"
      >
        View Profile
      </button>
    </div>
  );
}

export default MatchCard;
