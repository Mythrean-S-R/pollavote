import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Poll from "./pages/Poll";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/poll/:id" element={<Poll />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;