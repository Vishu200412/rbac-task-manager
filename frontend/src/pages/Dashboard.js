import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const STATUS_COLORS = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#22c55e",
};

const PRIORITY_LABELS = { 1: "🟢 Low", 2: "🟡 Medium", 3: "🔴 High" };

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", status: "pending", priority: 1 });

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks/");
      setTasks(res.data);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", status: "pending", priority: 1 });
    setEditTask(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTask) {
        await api.patch(`/tasks/${editTask.id}`, form);
        toast.success("Task updated!");
      } else {
        await api.post("/tasks/", form);
        toast.success("Task created!");
      }
      resetForm();
      fetchTasks();
    } catch (err) {
      const msg = err.response?.data?.detail || "Something went wrong";
      toast.error(Array.isArray(msg) ? msg[0].msg : msg);
    }
  };

  const handleEdit = (task) => {
    setForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority });
    setEditTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Task deleted");
      fetchTasks();
    } catch {
      toast.error("Failed to delete task");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Tasks</h1>
          <p style={styles.sub}>Hello, {user?.username} 👋 — {tasks.length} task(s) total</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} style={styles.addBtn}>
          {showForm ? "✕ Cancel" : "+ New Task"}
        </button>
      </div>

      {/* ── Create / Edit Form ── */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>{editTask ? "Edit Task" : "Create New Task"}</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              placeholder="Task title *" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input} required
            />
            <textarea
              placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ ...styles.input, height: "80px", resize: "vertical" }}
            />
            <div style={styles.row}>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={styles.select}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} style={styles.select}>
                <option value={1}>🟢 Low Priority</option>
                <option value={2}>🟡 Medium Priority</option>
                <option value={3}>🔴 High Priority</option>
              </select>
            </div>
            <button type="submit" style={styles.submitBtn}>
              {editTask ? "Update Task" : "Create Task"}
            </button>
          </form>
        </div>
      )}

      {/* ── Task List ── */}
      {loading ? (
        <p style={styles.empty}>Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={styles.empty}>No tasks yet. Create your first one! ☝️</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {tasks.map((task) => (
            <div key={task.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.badge, backgroundColor: STATUS_COLORS[task.status] }}>
                  {task.status.replace("_", " ")}
                </span>
                <span style={styles.priority}>{PRIORITY_LABELS[task.priority]}</span>
              </div>
              <h3 style={styles.taskTitle}>{task.title}</h3>
              {task.description && <p style={styles.desc}>{task.description}</p>}
              <p style={styles.date}>Created: {new Date(task.created_at).toLocaleDateString()}</p>
              <div style={styles.actions}>
                <button onClick={() => handleEdit(task)} style={styles.editBtn}>✏️ Edit</button>
                <button onClick={() => handleDelete(task.id)} style={styles.deleteBtn}>🗑️ Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { color: "#f1f5f9", fontSize: "28px", margin: 0 },
  sub: { color: "#64748b", marginTop: "6px", fontSize: "14px" },
  addBtn: { padding: "10px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  formCard: { backgroundColor: "#1e293b", borderRadius: "12px", padding: "24px", marginBottom: "28px" },
  formTitle: { color: "#f1f5f9", marginBottom: "16px", fontSize: "18px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: { padding: "11px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f1f5f9", fontSize: "14px", width: "100%", boxSizing: "border-box" },
  row: { display: "flex", gap: "12px" },
  select: { padding: "11px", borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#f1f5f9", fontSize: "14px", flex: 1 },
  submitBtn: { padding: "12px", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" },
  card: { backgroundColor: "#1e293b", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  badge: { padding: "4px 10px", borderRadius: "20px", fontSize: "12px", color: "white", fontWeight: "600", textTransform: "capitalize" },
  priority: { fontSize: "12px", color: "#94a3b8" },
  taskTitle: { color: "#f1f5f9", margin: 0, fontSize: "16px" },
  desc: { color: "#94a3b8", fontSize: "13px", margin: 0 },
  date: { color: "#475569", fontSize: "12px", margin: 0 },
  actions: { display: "flex", gap: "10px", marginTop: "6px" },
  editBtn: { flex: 1, padding: "8px", backgroundColor: "#334155", color: "#cbd5e1", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  deleteBtn: { flex: 1, padding: "8px", backgroundColor: "#450a0a", color: "#fca5a5", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
  emptyBox: { textAlign: "center", padding: "60px" },
  empty: { color: "#475569", textAlign: "center" },
};
