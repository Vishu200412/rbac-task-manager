import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data?.detail || "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            name="username" placeholder="Username" value={form.username}
            onChange={handleChange} style={styles.input} required
          />
          <input
            name="email" type="email" placeholder="Email" value={form.email}
            onChange={handleChange} style={styles.input} required
          />
          <input
            name="password" type="password" placeholder="Password (min 6 chars)"
            value={form.password} onChange={handleChange} style={styles.input} required
          />
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a" },
  card: { backgroundColor: "#1e293b", padding: "40px", borderRadius: "12px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.4)" },
  title: { color: "#f1f5f9", marginBottom: "24px", textAlign: "center", fontSize: "24px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  input: { padding: "12px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f1f5f9", fontSize: "14px" },
  btn: { padding: "12px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer", fontWeight: "600" },
  footer: { color: "#64748b", textAlign: "center", marginTop: "16px", fontSize: "14px" },
  link: { color: "#60a5fa" },
};
