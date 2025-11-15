import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
      }

      navigate("/preferences");
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
          placeholder="Name"
          className="w-full p-3 mb-4 rounded bg-[#2a3551] text-white"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 mb-4 rounded bg-[#2a3551] text-white"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-6 rounded bg-[#2a3551] text-white"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full p-3 rounded bg-blue-600 text-white font-semibold">
          Create Account
        </button>

        <p className="text-gray-400 text-center mt-4">
          Already have an account?
          <span
            className="text-blue-400 cursor-pointer"
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
