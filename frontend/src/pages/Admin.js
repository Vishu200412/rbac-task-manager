import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [tab, setTab] = useState("users");

  useEffect(() => {
    fetchUsers();
    fetchAllTasks();
  }, []);

  if (!user || user.role !== "admin") return <Navigate to="/dashboard" replace />;

  const fetchUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
    } catch { toast.error("Failed to load users"); }
  };

  const fetchAllTasks = async () => {
    try {
      const res = await api.get("/tasks/admin/all");
      setAllTasks(res.data);
    } catch { toast.error("Failed to load tasks"); }
  };

  const deactivateUser = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/deactivate`);
      toast.success("User deactivated");
      fetchUsers();
    } catch { toast.error("Failed to deactivate"); }
  };

  const makeAdmin = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/make-admin`);
      toast.success("User promoted to admin");
      fetchUsers();
    } catch { toast.error("Failed to promote"); }
  };

  const renderActions = (u) => {
    // Own row — no actions
    if (u.id === user.id) return <span style={styles.selfNote}>— current session</span>;

    return (
      <>
        <button onClick={() => deactivateUser(u.id)} style={styles.dangerBtn}>Deactivate</button>
        {/* Only show Make Admin if the user is not already an admin */}
        {u.role !== "admin" && (
          <button onClick={() => makeAdmin(u.id)} style={styles.warnBtn}>Make Admin</button>
        )}
      </>
    );
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🛡️ Admin Panel</h1>
      <div style={styles.tabs}>
        <button onClick={() => setTab("users")} style={tab === "users" ? styles.activeTab : styles.tab}>Users ({users.length})</button>
        <button onClick={() => setTab("tasks")} style={tab === "tasks" ? styles.activeTab : styles.tab}>All Tasks ({allTasks.length})</button>
      </div>

      {tab === "users" && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Active</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>{u.id}</td>
                  <td style={styles.td}>
                    {u.id === user.id
                      ? <span>{u.username} <span style={styles.youBadge}>you</span></span>
                      : u.username}
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{ color: u.role === "admin" ? "#f59e0b" : "#60a5fa" }}>{u.role}</span>
                  </td>
                  <td style={styles.td}>{u.is_active ? "✅" : "❌"}</td>
                  <td style={styles.td}>{renderActions(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "tasks" && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>User ID</th>
              </tr>
            </thead>
            <tbody>
              {allTasks.map((t) => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{t.id}</td>
                  <td style={styles.td}>{t.title}</td>
                  <td style={styles.td}>{t.status}</td>
                  <td style={styles.td}>{t.priority}</td>
                  <td style={styles.td}>{t.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" },
  title: { color: "#f1f5f9", marginBottom: "24px" },
  tabs: { display: "flex", gap: "12px", marginBottom: "24px" },
  tab: { padding: "10px 20px", backgroundColor: "#1e293b", color: "#94a3b8", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  activeTab: { padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { backgroundColor: "#1e293b" },
  th: { padding: "12px 16px", color: "#94a3b8", textAlign: "left", fontSize: "13px", fontWeight: "600" },
  tr: { borderBottom: "1px solid #1e293b" },
  td: { padding: "12px 16px", color: "#cbd5e1", fontSize: "14px" },
  youBadge: { display: "inline-block", marginLeft: "8px", padding: "2px 8px", backgroundColor: "#1e3a5f", color: "#60a5fa", borderRadius: "20px", fontSize: "11px", fontWeight: "600" },
  selfNote: { color: "#475569", fontSize: "13px", fontStyle: "italic" },
  dangerBtn: { marginRight: "8px", padding: "5px 10px", backgroundColor: "#450a0a", color: "#fca5a5", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" },
  warnBtn: { padding: "5px 10px", backgroundColor: "#451a03", color: "#fcd34d", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "12px" },
};
