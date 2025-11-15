import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { isProfileComplete } from "../utils/profileCheck";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // Call the backend register endpoint
      const res = await axios.post("http://localhost:5001/api/user/register", {
        name,
        email,
        password,
      });

      // Save userId to localStorage for future use
      if (res.data.userId) {
        localStorage.setItem("userId", res.data.userId);
        
        // Check if profile is complete (unlikely for new signup, but check anyway)
        try {
          const userRes = await axios.get(`http://localhost:5001/api/user/${res.data.userId}`);
          const user = userRes.data;
          
          if (isProfileComplete(user)) {
            // Profile is complete - go directly to matches
            navigate("/match-list");
          } else {
            // Profile incomplete - go to profile to fill mandatory fields
            navigate("/profile");
          }
        } catch (userErr) {
          // If we can't fetch user, go to profile as fallback
          console.error("Error fetching user after signup:", userErr);
          navigate("/profile");
        }
      } else {
        // Fallback if no userId
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.error || "Signup failed";
      alert(errorMessage);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#0d1425]">
      <form
        onSubmit={handleSignup}
        className="bg-[#1b243a] p-10 rounded-lg w-[400px]"
      >
        <h2 className="text-white text-3xl font-bold mb-6 text-center">
          Sign Up
        </h2>

        <input
          type="text"
          placeholder="Name *"
          required
          className="w-full p-3 mb-4 rounded bg-[#2a3551] text-white"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email *"
          required
          className="w-full p-3 mb-4 rounded bg-[#2a3551] text-white"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password *"
          required
          className="w-full p-3 mb-6 rounded bg-[#2a3551] text-white"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button 
          type="submit"
          className="w-full p-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          Create Account
        </button>

        <p className="text-gray-400 text-center mt-4">
          Already have an account?
          <span
            className="text-blue-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            {" "}
            Log in
          </span>
        </p>
      </form>
    </div>
  );
}
