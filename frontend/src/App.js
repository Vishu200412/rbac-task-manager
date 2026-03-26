import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: "100vh", backgroundColor: "#0f172a" }}>
          <Navbar />
          <Toaster position="top-right" toastOptions={{ style: { background: "#1e293b", color: "#f1f5f9" } }} />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
