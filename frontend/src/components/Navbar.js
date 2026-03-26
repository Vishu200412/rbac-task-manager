import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.brand}>📋 TaskApp</Link>
      <div style={styles.right}>
        {user ? (
          <>
            <span style={styles.welcome}>👤 {user.username}</span>
            {user.role === "admin" && (
              <Link to="/admin" style={styles.link}>Admin Panel</Link>
            )}
            <button onClick={handleLogout} style={styles.btn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Login</Link>
            <Link to="/register" style={styles.link}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 32px", backgroundColor: "#1e293b", color: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  brand: {
    fontSize: "20px", fontWeight: "700", color: "#60a5fa",
    textDecoration: "none",
  },
  right: { display: "flex", alignItems: "center", gap: "16px" },
  welcome: { color: "#94a3b8", fontSize: "14px" },
  link: { color: "#cbd5e1", textDecoration: "none", fontSize: "14px" },
  btn: {
    padding: "6px 14px", backgroundColor: "#ef4444", color: "white",
    border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px",
  },
};
