import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Preferences from "./pages/Preferences";
import MatchList from "./pages/MatchList";
import MatchProfile from "./pages/MatchProfile";
import JamSession from "./pages/JamSession";
import WatchParty from "./pages/WatchParty";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/match-list" element={<MatchList />} />
        <Route path="/match-profile/:id" element={<MatchProfile />} />
        <Route path="/jam-session" element={<JamSession />} />
        <Route path="/watch-party" element={<WatchParty />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
