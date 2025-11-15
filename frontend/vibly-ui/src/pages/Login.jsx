import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
  try {
    const res = await axios.post(
      "http://localhost:5000/api/user/login",
      { email, password }
    );

    localStorage.setItem("userId", res.data.userId);
    window.location.href = "/preferences";
  } catch (err) {
    setError("Invalid credentials");
  }
};


  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-10 rounded-xl w-[400px] shadow-lg">
        <h1 className="text-3xl text-white text-center mb-6 font-bold">
          Login
        </h1>

        <input
          type="email"
          className="w-full mb-4 p-3 rounded bg-slate-700 text-white"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-4 p-3 rounded bg-slate-700 text-white"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded"
        >
          Login
        </button>

        <p className="text-gray-400 mt-4 text-center">
          Don’t have an account?{" "}
          <a className="text-blue-400 hover:underline" href="/signup">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
