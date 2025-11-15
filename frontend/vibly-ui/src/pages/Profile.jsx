import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [taste, setTaste] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login");
          return;
        }

        // Get user info
        const userRes = await axios.get(`http://localhost:5001/api/user/${userId}`);
        setUser(userRes.data);

        // Get taste preferences
        const tasteRes = await axios.get(`http://localhost:5001/api/taste/${userId}`);
        setTaste(tasteRes.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white text-xl">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/preferences")}
              className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit Preferences
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        {user && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
            <p className="text-gray-300 mb-2"><span className="font-semibold">Name:</span> {user.name}</p>
            <p className="text-gray-300"><span className="font-semibold">Email:</span> {user.email}</p>
          </div>
        )}

        {taste && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">My Preferences</h2>
            
            {taste.movies && taste.movies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Movies</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.movies.map((movie, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof movie === "object" ? movie.title || movie.name : movie}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taste.music && taste.music.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">Music</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.music.map((artist, idx) => (
                    <span
                      key={idx}
                      className="bg-purple-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof artist === "object" ? artist.name || artist.title : artist}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {taste.shows && taste.shows.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-2">TV Shows</h3>
                <div className="flex flex-wrap gap-2">
                  {taste.shows.map((show, idx) => (
                    <span
                      key={idx}
                      className="bg-green-600 px-3 py-1 rounded text-sm"
                    >
                      {typeof show === "object" ? show.title || show.name : show}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(!taste.movies || taste.movies.length === 0) &&
             (!taste.music || taste.music.length === 0) &&
             (!taste.shows || taste.shows.length === 0) && (
              <p className="text-gray-400">No preferences set yet. <button onClick={() => navigate("/preferences")} className="text-blue-400 hover:underline">Add preferences</button></p>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => navigate("/match-list")}
            className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition flex-1"
          >
            View Matches
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;

