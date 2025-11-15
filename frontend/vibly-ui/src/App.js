import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Preferences from "./pages/Preferences";
import MatchList from "./pages/MatchList";
import MatchProfile from "./pages/MatchProfile";
import JamSession from "./pages/JamSession";
import WatchParty from "./pages/WatchParty";
import Profile from "./pages/Profile";
import RedirectToLogin from "./components/RedirectToLogin";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectToLogin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/match-list" element={<MatchList />} />
        <Route path="/match-profile/:id" element={<MatchProfile />} />
        <Route path="/jam-session" element={<JamSession />} />
        <Route path="/watch-party" element={<WatchParty />} />
        <Route path="/profile" element={<Profile />} />
        {/* Catch-all route - redirect any unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
