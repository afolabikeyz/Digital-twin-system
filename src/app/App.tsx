import React, { useState, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Activity, AlertTriangle, ArrowRight, Bell, Brain,
  ChevronLeft, CheckCircle, Clock, Cpu,
  Download, Eye, FileText, FlaskConical,
  GraduationCap, Home, Lock, LogOut, Menu,
  Moon, Pause, Play, Plus, RefreshCw,
  RotateCcw, Search, Settings, Shield, Square,
  Sun, Terminal, User, Users, Wifi, X,
  BarChart2, BookOpen, HardDrive, AlertCircle, MapPin,
  GitBranch, Radio, ChevronRight, Filter,
  Key, ListTodo, CheckSquare, Smartphone, Mail, MessageSquare, Sliders,
  Zap, Eye as EyeIcon, ExternalLink, Bookmark, Send
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | "landing" | "features" | "documentation" | "research" | "register"
  | "dashboard" | "twins" | "monitoring"
  | "simulations" | "analytics" | "reports" | "devices"
  | "users" | "audit" | "settings" | "tasks";

const PUBLIC_PAGES: Page[] = ["landing", "features", "documentation", "research", "register"];

type Role = "admin" | "lecturer" | "student" | "researcher";
type SimStatus = "running" | "paused" | "completed" | "stopped";
type DeviceStatus = "online" | "offline" | "warning";
type TwinStatus = "active" | "inactive" | "syncing" | "warning";
type AlertType = "info" | "warning" | "error" | "success";

interface SensorPoint {
  time: string;
  temperature: number;
  humidity: number;
  voltage: number;
  current: number;
  pressure: number;
}

interface Twin {
  id: string; name: string; description: string; status: TwinStatus;
  type: string; lastSync: string; accuracy: number; sensors: number; dataPoints: number;
}

interface Simulation {
  id: string; name: string; twin: string; status: SimStatus;
  progress: number; startTime: string; duration: string;
  createdBy: string; scenarios: number;
}

interface Device {
  id: string; name: string; type: string; status: DeviceStatus;
  location: string; lastSeen: string; sensors: number; firmware: string;
}

interface UserRecord {
  id: string; name: string; email: string; role: Role;
  status: "active" | "suspended" | "pending"; lastLogin: string; dept: string;
  phone?: string; registeredAt?: string;
}

interface Notif {
  id: string; type: AlertType; message: string; time: string; read: boolean;
}

interface AuditEntry {
  id: string; user: string; action: string; resource: string;
  ts: string; ip: string; ok: boolean;
}

type TaskPriority = "high" | "medium" | "low";
interface TaskRecord {
  id: string; title: string; desc: string; due: string;
  priority: TaskPriority; done: boolean; createdAt: string; role: Role;
  category: string;
}

const TASKS_LS_KEY = "twinsphere_tasks";
function loadTasks(): TaskRecord[] {
  try { const r = localStorage.getItem(TASKS_LS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveTasks(tasks: TaskRecord[]) {
  localStorage.setItem(TASKS_LS_KEY, JSON.stringify(tasks));
}

const SEED_TASKS: TaskRecord[] = [
  { id: "t1", title: "Complete EEE 302 Simulation Lab Report", desc: "Submit simulation results for Power Load Surge Analysis assignment", due: "2025-01-25", priority: "high", done: false, createdAt: "2025-01-20", role: "student", category: "Assignment" },
  { id: "t2", title: "Review Live Sensor Data for Lab 1", desc: "Check temperature and humidity thresholds for EEE Lab 1 sensors", due: "2025-01-24", priority: "medium", done: false, createdAt: "2025-01-20", role: "student", category: "Lab Work" },
  { id: "t3", title: "Run Solar Irradiance Twin Simulation", desc: "Execute the 2-scenario solar forecast simulation assigned by Dr. Akinleye", due: "2025-01-26", priority: "high", done: false, createdAt: "2025-01-21", role: "student", category: "Simulation" },
  { id: "t4", title: "Download and Study Simulation Report", desc: "Review the completed solar irradiance simulation report for coursework", due: "2025-01-27", priority: "low", done: true, createdAt: "2025-01-18", role: "student", category: "Study" },
  { id: "t5", title: "Prepare EEE 302 Lecture Notes", desc: "Update digital twin lecture slides for next week's class", due: "2025-01-26", priority: "high", done: false, createdAt: "2025-01-20", role: "lecturer", category: "Teaching" },
  { id: "t6", title: "Approve Student Simulation Projects", desc: "Review and approve 3 pending simulation project submissions", due: "2025-01-24", priority: "high", done: false, createdAt: "2025-01-21", role: "lecturer", category: "Assessment" },
  { id: "t7", title: "Update Generator Room Twin Calibration", desc: "Recalibrate vibration sensor thresholds after maintenance", due: "2025-01-28", priority: "medium", done: false, createdAt: "2025-01-20", role: "lecturer", category: "Lab Work" },
  { id: "t8", title: "Review ML Anomaly Detection Results", desc: "Analyze Isolation Forest outputs from last week's experiment batch", due: "2025-01-25", priority: "high", done: false, createdAt: "2025-01-21", role: "researcher", category: "Research" },
  { id: "t9", title: "Submit Research Paper Draft", desc: "Finalize the predictive maintenance paper for journal submission", due: "2025-01-30", priority: "high", done: false, createdAt: "2025-01-19", role: "researcher", category: "Publication" },
  { id: "t10", title: "Configure New Sensor Nodes (3x)", desc: "Register and configure the three new IoT vibration nodes for Building B", due: "2025-01-24", priority: "high", done: false, createdAt: "2025-01-20", role: "admin", category: "Infrastructure" },
  { id: "t11", title: "Approve 5 Pending User Registrations", desc: "Review and approve new platform registrations", due: "2025-01-23", priority: "high", done: false, createdAt: "2025-01-22", role: "admin", category: "Administration" },
  { id: "t12", title: "Platform Security Audit", desc: "Run quarterly access log review and patch firmware on offline devices", due: "2025-01-31", priority: "medium", done: false, createdAt: "2025-01-20", role: "admin", category: "Security" },
];

// ─── Static Data ──────────────────────────────────────────────────────────────

function makeSensorData(n: number): SensorPoint[] {
  let t = 24, h = 58, v = 220, c = 15.2, p = 1013;
  return Array.from({ length: n }, (_, i) => {
    t += (Math.random() - 0.48) * 0.7;
    h += (Math.random() - 0.48) * 1.1;
    v += (Math.random() - 0.5) * 1.3;
    c += (Math.random() - 0.5) * 0.35;
    p += (Math.random() - 0.5) * 0.25;
    const d = new Date(Date.now() - (n - i) * 300_000);
    return {
      time: d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0"),
      temperature: +Math.max(18, Math.min(36, t)).toFixed(1),
      humidity: +Math.max(30, Math.min(92, h)).toFixed(1),
      voltage: +Math.max(208, Math.min(236, v)).toFixed(1),
      current: +Math.max(8, Math.min(26, c)).toFixed(2),
      pressure: +Math.max(1005, Math.min(1025, p)).toFixed(1),
    };
  });
}

const TWINS: Twin[] = [
  { id: "dt001", name: "Electrical Lab Twin", description: "EEE Lab 1 — power distribution & switchgear", status: "active", type: "Electrical System", lastSync: "2m ago", accuracy: 97.3, sensors: 12, dataPoints: 284_750 },
  { id: "dt002", name: "HVAC Control Twin", description: "Building A heating, ventilation & air conditioning", status: "active", type: "Mechanical System", lastSync: "5s ago", accuracy: 99.1, sensors: 8, dataPoints: 1_024_330 },
  { id: "dt003", name: "Water Treatment Twin", description: "Civil engineering water treatment plant model", status: "syncing", type: "Civil Infrastructure", lastSync: "15m ago", accuracy: 91.8, sensors: 16, dataPoints: 87_420 },
  { id: "dt004", name: "Solar PV Array", description: "100 kW rooftop photovoltaic system & MPPT", status: "active", type: "Energy System", lastSync: "1m ago", accuracy: 98.6, sensors: 24, dataPoints: 523_100 },
  { id: "dt005", name: "Generator Room", description: "Standby diesel generator predictive maintenance", status: "warning", type: "Power Generation", lastSync: "3m ago", accuracy: 94.2, sensors: 6, dataPoints: 198_640 },
  { id: "dt006", name: "ICT Lab Network", description: "60-workstation network topology & bandwidth", status: "inactive", type: "IT Infrastructure", lastSync: "2d ago", accuracy: 88.5, sensors: 4, dataPoints: 34_200 },
];

const SIMULATIONS: Simulation[] = [
  { id: "sim001", name: "Power Load Surge Analysis", twin: "Electrical Lab Twin", status: "running", progress: 67, startTime: "10:45", duration: "2h 15m", createdBy: "Engr. Adewale", scenarios: 3 },
  { id: "sim002", name: "HVAC Fault Injection", twin: "HVAC Control Twin", status: "paused", progress: 42, startTime: "09:30", duration: "45m", createdBy: "Dr. Ibrahim", scenarios: 5 },
  { id: "sim003", name: "Solar Irradiance Forecast", twin: "Solar PV Array", status: "completed", progress: 100, startTime: "08:00", duration: "1h 30m", createdBy: "Dr. Akinleye", scenarios: 2 },
  { id: "sim004", name: "Water Pressure Stress Test", twin: "Water Treatment Twin", status: "running", progress: 23, startTime: "11:00", duration: "30m", createdBy: "Engr. Balogun", scenarios: 4 },
  { id: "sim005", name: "Generator Load Transfer", twin: "Generator Room", status: "stopped", progress: 0, startTime: "—", duration: "—", createdBy: "Tech. Adeyemi", scenarios: 1 },
];

const DEVICES: Device[] = [
  { id: "dev001", name: "Temp Node — EEE-01", type: "Temperature/Humidity", status: "online", location: "EEE Lab 1", lastSeen: "2s ago", sensors: 3, firmware: "v2.4.1" },
  { id: "dev002", name: "Power Monitor Gateway", type: "Power Meter", status: "online", location: "Main Substation", lastSeen: "5s ago", sensors: 6, firmware: "v3.1.0" },
  { id: "dev003", name: "HVAC Controller Unit", type: "Environmental", status: "online", location: "Building A", lastSeen: "1s ago", sensors: 4, firmware: "v2.2.3" },
  { id: "dev004", name: "Solar MPPT Monitor", type: "Energy Meter", status: "online", location: "Rooftop", lastSeen: "8s ago", sensors: 8, firmware: "v1.9.7" },
  { id: "dev005", name: "Vibration Sensor Node", type: "Vibration/IMU", status: "warning", location: "Generator Room", lastSeen: "12s ago", sensors: 2, firmware: "v2.0.0" },
  { id: "dev006", name: "Water Flow Sensor", type: "Flow Meter", status: "online", location: "Water Plant", lastSeen: "3s ago", sensors: 3, firmware: "v1.5.2" },
  { id: "dev007", name: "Network Probe Alpha", type: "Network Monitor", status: "offline", location: "ICT Lab", lastSeen: "2d ago", sensors: 1, firmware: "v4.0.1" },
  { id: "dev008", name: "Humidity Array Node", type: "Humidity", status: "online", location: "Library", lastSeen: "4s ago", sensors: 5, firmware: "v2.3.1" },
];

const USERS: UserRecord[] = [
  { id: "u1", name: "Dr. Abdullahi Musa", email: "a.musa@aop.edu.ng", role: "admin", status: "active", lastLogin: "Today 08:32", dept: "ICT Services" },
  { id: "u2", name: "Engr. Olusegun Adewale", email: "o.adewale@aop.edu.ng", role: "lecturer", status: "active", lastLogin: "Today 09:15", dept: "EEE Department" },
  { id: "u3", name: "Dr. Fatima Ibrahim", email: "f.ibrahim@aop.edu.ng", role: "researcher", status: "active", lastLogin: "Today 07:50", dept: "Applied Sciences" },
  { id: "u4", name: "Adekola Oduola", email: "adekola.o@aop.edu.ng", role: "student", status: "active", lastLogin: "Today 10:02", dept: "EEE — ND2" },
  { id: "u5", name: "Chidinma Okafor", email: "c.okafor@aop.edu.ng", role: "student", status: "active", lastLogin: "Today 09:58", dept: "Civil Eng." },
  { id: "u6", name: "Engr. Babatunde Balogun", email: "b.balogun@aop.edu.ng", role: "lecturer", status: "active", lastLogin: "Yesterday 16:45", dept: "Mechanical Eng." },
  { id: "u7", name: "Taiwo Adeyemi", email: "t.adeyemi@aop.edu.ng", role: "student", status: "suspended", lastLogin: "3 days ago", dept: "ICT" },
  { id: "u8", name: "Dr. Yetunde Akinleye", email: "y.akinleye@aop.edu.ng", role: "researcher", status: "active", lastLogin: "Today 08:20", dept: "Physics" },
];

// Demo password for all built-in accounts
const DEMO_PASSWORD = "aop2025";

// Built-in credentials: email → { role, name, password }
const BUILTIN_CREDENTIALS: Record<string, { role: Role; name: string; dept: string }> = {
  "a.musa@aop.edu.ng":      { role: "admin",      name: "Dr. Abdullahi Musa",      dept: "ICT Services" },
  "o.adewale@aop.edu.ng":   { role: "lecturer",   name: "Engr. Olusegun Adewale",  dept: "EEE Department" },
  "b.balogun@aop.edu.ng":   { role: "lecturer",   name: "Engr. Babatunde Balogun", dept: "Mechanical Eng." },
  "f.ibrahim@aop.edu.ng":   { role: "researcher", name: "Dr. Fatima Ibrahim",       dept: "Applied Sciences" },
  "y.akinleye@aop.edu.ng":  { role: "researcher", name: "Dr. Yetunde Akinleye",    dept: "Physics" },
  "adekola.o@aop.edu.ng":   { role: "student",    name: "Adekola Oduola",           dept: "EEE — ND2" },
  "c.okafor@aop.edu.ng":    { role: "student",    name: "Chidinma Okafor",          dept: "Civil Eng." },
};

function authenticate(email: string, password: string, registeredUsers: UserRecord[]): { ok: boolean; role?: Role; name?: string; reason?: string } {
  const e = email.trim().toLowerCase();
  const p = password.trim();
  if (!e || !p) return { ok: false, reason: "Enter your email and password." };

  // Check built-in accounts (password: aop2025)
  const builtin = BUILTIN_CREDENTIALS[e];
  if (builtin) {
    if (p !== DEMO_PASSWORD) return { ok: false, reason: "Incorrect password. (Hint: aop2025)" };
    return { ok: true, role: builtin.role, name: builtin.name };
  }

  // Check self-registered accounts
  const regUser = registeredUsers.find(u => u.email.toLowerCase() === e);
  if (regUser) {
    if (regUser.status === "pending") return { ok: false, reason: "Account pending administrator approval." };
    if (regUser.status === "suspended") return { ok: false, reason: "Account suspended. Contact ICT Services." };
    // For registered users accept any non-empty password (demo mode)
    return { ok: true, role: regUser.role, name: regUser.name };
  }

  return { ok: false, reason: "No account found for that email address." };
}

// ─── Persistent User Store ────────────────────────────────────────────────────

const LS_KEY = "twinsphere_registered_users";

function loadRegisteredUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as UserRecord[]) : [];
  } catch { return []; }
}

function saveRegisteredUsers(users: UserRecord[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(users));
}

// ─── Publication Download ─────────────────────────────────────────────────────

function downloadPublication(paper: { title: string; authors: string; journal: string; year: string; status: string }) {
  const content = [
    "TWINSPHERE RESEARCH PLATFORM — PUBLICATION RECORD",
    "Adeseun Ogundoyin Polytechnic, Eruwa, Oyo State, Nigeria",
    "═".repeat(64),
    "",
    `TITLE:    ${paper.title}`,
    `AUTHORS:  ${paper.authors}`,
    `JOURNAL:  ${paper.journal}`,
    `YEAR:     ${paper.year}`,
    `STATUS:   ${paper.status}`,
    "",
    "═".repeat(64),
    "ABSTRACT",
    "═".repeat(64),
    "",
    "This paper presents findings from the TwinSphere Research Programme at",
    "Adeseun Ogundoyin Polytechnic (AOP), Eruwa. The study investigates",
    "real-time IoT-driven digital twin systems as instruments for transforming",
    "engineering education and smart campus infrastructure under Industry 4.0.",
    "",
    "Key findings include sub-50ms synchronization latency between physical",
    "sensor networks and digital twin virtual models, predictive fault",
    "detection accuracy of 94.7% using Random Forest algorithms, and",
    "demonstrated scalability supporting 47 concurrent simulations.",
    "",
    "═".repeat(64),
    "CITATION",
    "═".repeat(64),
    "",
    `${paper.authors} (${paper.year}). ${paper.title}.`,
    `${paper.journal}. TwinSphere Research Programme, AOP Eruwa.`,
    "",
    "─".repeat(64),
    "Downloaded from TwinSphere Platform · https://twinsphere.aop.edu.ng",
    `Generated: ${new Date().toLocaleString()}`,
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${paper.authors.split(",")[0].trim()}_${paper.year}_${paper.title.slice(0, 30).replace(/\s+/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadReport(r: { name: string; type: string; size: string; date: string; twin: string }) {
  const content = [
    "TWINSPHERE DIGITAL TWIN PLATFORM — REPORT EXPORT",
    "Adeseun Ogundoyin Polytechnic, Eruwa, Oyo State, Nigeria",
    "═".repeat(64),
    "",
    `REPORT:   ${r.name}`,
    `SOURCE:   ${r.twin}`,
    `FORMAT:   ${r.type}`,
    `SIZE:     ${r.size}`,
    `DATE:     ${r.date}`,
    "",
    "═".repeat(64),
    "SUMMARY",
    "═".repeat(64),
    "",
    "This report was generated by the TwinSphere platform based on live IoT",
    "sensor data and digital twin simulation outputs. The data reflects",
    "real-time measurements from campus infrastructure at AOP Eruwa.",
    "",
    "All figures are based on digital twin model accuracy ≥ 91% against",
    "physical sensor readings. Anomalies flagged by ML models (Isolation",
    "Forest, Random Forest) are included with confidence scores.",
    "",
    "─".repeat(64),
    `Downloaded from TwinSphere Platform · https://twinsphere.aop.edu.ng`,
    `Generated: ${new Date().toLocaleString()}`,
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${r.name.slice(0, 40).replace(/[^a-zA-Z0-9]/g, "_")}_${r.date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const NOTIFS: Notif[] = [
  { id: "n1", type: "warning", message: "Generator Room vibration exceeding threshold (12.4 mm/s)", time: "2m ago", read: false },
  { id: "n2", type: "success", message: "Solar Irradiance Forecast simulation completed successfully", time: "8m ago", read: false },
  { id: "n3", type: "error", message: "Network Probe Alpha offline — last seen 2 days ago", time: "2d ago", read: true },
  { id: "n4", type: "info", message: "New prediction report: Power Load Fault Analysis ready", time: "1h ago", read: true },
  { id: "n5", type: "warning", message: "Water Treatment Twin sync delayed — MQTT reconnecting", time: "15m ago", read: false },
];

const AUDIT: AuditEntry[] = [
  { id: "a1", user: "Dr. Abdullahi Musa", action: "LOGIN", resource: "Authentication", ts: "2025-01-22 08:32:14", ip: "192.168.1.101", ok: true },
  { id: "a2", user: "Engr. Adewale", action: "START_SIMULATION", resource: "sim001", ts: "2025-01-22 10:45:02", ip: "192.168.1.105", ok: true },
  { id: "a3", user: "Dr. Ibrahim", action: "EXPORT_DATASET", resource: "dt004/readings", ts: "2025-01-22 10:30:50", ip: "192.168.1.108", ok: true },
  { id: "a4", user: "Taiwo Adeyemi", action: "LOGIN", resource: "Authentication", ts: "2025-01-19 11:22:08", ip: "10.0.0.55", ok: false },
  { id: "a5", user: "Adekola Oduola", action: "CREATE_MODEL", resource: "dt007", ts: "2025-01-22 09:48:33", ip: "192.168.1.120", ok: true },
  { id: "a6", user: "Dr. Abdullahi Musa", action: "DELETE_USER", resource: "usr_temp_003", ts: "2025-01-22 08:55:17", ip: "192.168.1.101", ok: true },
  { id: "a7", user: "Engr. Balogun", action: "UPDATE_DEVICE", resource: "dev005", ts: "2025-01-22 09:10:44", ip: "192.168.1.112", ok: true },
];

const predData = [
  { m: "Aug", actual: 87, pred: 89, health: 92 },
  { m: "Sep", actual: 84, pred: 86, health: 89 },
  { m: "Oct", actual: 91, pred: 90, health: 94 },
  { m: "Nov", actual: 88, pred: 87, health: 91 },
  { m: "Dec", actual: 82, pred: 84, health: 86 },
  { m: "Jan", actual: 79, pred: 81, health: 83 },
  { m: "Feb", actual: null, pred: 76, health: 79 },
  { m: "Mar", actual: null, pred: 74, health: 77 },
];

const perfData = [
  { name: "Electrical", accuracy: 97.3, uptime: 99.8 },
  { name: "HVAC", accuracy: 99.1, uptime: 99.9 },
  { name: "Water", accuracy: 91.8, uptime: 97.2 },
  { name: "Solar", accuracy: 98.6, uptime: 99.6 },
  { name: "Generator", accuracy: 94.2, uptime: 98.1 },
];

const healthPie = [
  { name: "Online", value: 6, color: "#10b981" },
  { name: "Warning", value: 1, color: "#f59e0b" },
  { name: "Offline", value: 1, color: "#ef4444" },
];

// ─── Micro Components ─────────────────────────────────────────────────────────

function Badge({ children, color = "cyan" }: { children: React.ReactNode; color?: "cyan" | "green" | "amber" | "red" | "violet" | "slate" | string }) {
  const map = {
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium border ${map[color] ?? map.slate}`}>
      {children}
    </span>
  );
}

function Dot({ status }: { status: "online" | "offline" | "warning" | "active" | "inactive" | "syncing" | "running" | "paused" | "completed" | "stopped" }) {
  const map: Record<string, string> = {
    online: "bg-emerald-400", active: "bg-emerald-400", running: "bg-emerald-400",
    warning: "bg-amber-400",
    offline: "bg-red-400", inactive: "bg-slate-500", stopped: "bg-slate-500",
    syncing: "bg-cyan-400", paused: "bg-amber-400",
    completed: "bg-emerald-400",
  };
  const pulse = ["online", "active", "running", "syncing"].includes(status);
  return (
    <span className="relative flex h-2 w-2">
      {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${map[status]}`} />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${map[status] || "bg-slate-500"}`} />
    </span>
  );
}

function GlassCard({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm
        dark:border-cyan-500/[0.08] dark:bg-cyan-500/[0.02] ${onClick ? "cursor-pointer hover:border-cyan-500/20 hover:bg-cyan-500/[0.04]" : ""}
        transition-all duration-200 ${className}`}
    >
      {children}
    </div>
  );
}

function KpiCard({ label, value, unit, delta, icon: Icon, color }: {
  label: string; value: string | number; unit?: string;
  delta?: string; icon: React.ElementType; color: string;
}) {
  return (
    <GlassCard className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</span>
        <span className={`p-1.5 rounded-lg ${color}`}><Icon size={14} /></span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-['Exo_2'] font-bold text-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground font-mono">{unit}</span>}
      </div>
      {delta && <span className="text-xs text-emerald-400 font-mono">{delta}</span>}
    </GlassCard>
  );
}

function SimStatusBadge({ status }: { status: SimStatus }) {
  const map: Record<SimStatus, { color: "green" | "amber" | "cyan" | "slate" | "red"; label: string }> = {
    running: { color: "green", label: "Running" },
    paused: { color: "amber", label: "Paused" },
    completed: { color: "cyan", label: "Completed" },
    stopped: { color: "slate", label: "Stopped" },
  };
  return <Badge color={map[status].color}>{map[status].label}</Badge>;
}

function TwinStatusBadge({ status }: { status: TwinStatus }) {
  const map: Record<TwinStatus, { color: "green" | "amber" | "cyan" | "slate" | "red"; label: string }> = {
    active: { color: "green", label: "Active" },
    syncing: { color: "cyan", label: "Syncing" },
    warning: { color: "amber", label: "Warning" },
    inactive: { color: "slate", label: "Inactive" },
  };
  return <Badge color={map[status].color}>{map[status].label}</Badge>;
}

function DevStatusBadge({ status }: { status: DeviceStatus }) {
  const map: Record<DeviceStatus, { color: "green" | "amber" | "red"; label: string }> = {
    online: { color: "green", label: "Online" },
    warning: { color: "amber", label: "Warning" },
    offline: { color: "red", label: "Offline" },
  };
  return <Badge color={map[status].color}>{map[status].label}</Badge>;
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-['Exo_2'] font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Chart Config ─────────────────────────────────────────────────────────────

const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#071428",
    border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
    fontFamily: "JetBrains Mono, monospace",
  },
  labelStyle: { color: "#94a3b8", marginBottom: 4 },
};

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ onLogin, onNavigate }: { onLogin: (role: Role, name: string) => void; onNavigate: (p: Page) => void }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const stats = [
    { label: "Digital Twins", value: "6", suffix: "Active" },
    { label: "Sensors Online", value: "42", suffix: "Streaming" },
    { label: "Data Points", value: "2.1M", suffix: "Collected" },
    { label: "Accuracy", value: "97.3%", suffix: "Average" },
  ];

  const features = [
    { icon: GitBranch, title: "Digital Twin Management", desc: "Create, clone, version and manage virtual replicas of physical systems with full lifecycle control.", color: "text-cyan-400" },
    { icon: Radio, title: "Live IoT Data Streams", desc: "MQTT, WebSocket, and REST ingestion from temperature, voltage, vibration, flow, and custom sensors.", color: "text-violet-400" },
    { icon: Activity, title: "Real-Time Simulation", desc: "Run multi-scenario simulations with pause, replay, and comparison — powered by live synchronization.", color: "text-emerald-400" },
    { icon: Brain, title: "Predictive Analytics", desc: "ML-based fault detection, equipment health scoring, and trend forecasting using Random Forest & LSTM models.", color: "text-amber-400" },
    { icon: BarChart2, title: "Interactive Dashboards", desc: "Dynamic charts, KPI gauges, heat maps, and time-series visualizations tailored to each user role.", color: "text-rose-400" },
    { icon: Shield, title: "Enterprise Security", desc: "JWT + refresh tokens, RBAC, 2FA, audit logging, OWASP-compliant input validation, and encrypted data at rest.", color: "text-cyan-400" },
  ];

  const roles = [
    { role: "admin" as Role, icon: Shield, label: "Administrator", desc: "Full system control, user management, device configuration & audit logs." },
    { role: "lecturer" as Role, icon: GraduationCap, label: "Lecturer", desc: "Create simulations, manage students, monitor results & generate reports." },
    { role: "student" as Role, icon: BookOpen, label: "Student", desc: "Join simulations, monitor live data, create virtual models & view dashboards." },
    { role: "researcher" as Role, icon: FlaskConical, label: "Researcher", desc: "Advanced analytics, ML model testing, dataset export & predictive analysis." },
  ];

  return (
    <div className="min-h-screen bg-[#030d1e] text-[#e2e8f0] font-['Inter'] overflow-x-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(0,212,255,0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139,92,246,0.06) 0%, transparent 50%),
            linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
            <GitBranch size={16} className="text-white" />
          </div>
          <div>
            <span className="font-['Exo_2'] font-bold text-lg text-white tracking-tight">TwinSphere</span>
            <span className="hidden md:inline text-xs text-cyan-400/70 font-mono ml-2">by AOP</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          <button onClick={() => onNavigate("features")} className="hover:text-cyan-400 transition-colors">Features</button>
          <button onClick={() => onNavigate("documentation")} className="hover:text-cyan-400 transition-colors">Documentation</button>
          <button onClick={() => onNavigate("research")} className="hover:text-cyan-400 transition-colors">Research</button>
          <button onClick={() => onNavigate("register")} className="hover:text-cyan-400 transition-colors">Register</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate("register")}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/10 transition-all duration-200">
            Create Account
          </button>
          <button onClick={() => setLoginOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 transition-all duration-200">
            <Lock size={14} /> Sign In
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-16 px-6 md:px-12 text-center max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Industry 4.0 — Smart Campus Platform — AOP Eruwa
          </div>
          <h1 className="font-['Exo_2'] font-black text-5xl md:text-7xl text-white mb-6 leading-[1.05]">
            Digital Twin<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Platform
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Real-time IoT synchronization, predictive analytics, and intelligent simulation for
            Adeseun Ogundoyin Polytechnic — bridging physical systems with their digital counterparts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => onNavigate("register")}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-[#030d1e] font-semibold font-['Exo_2'] hover:bg-cyan-400 transition-all duration-200 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
              Create Account <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("documentation")} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400 transition-all duration-200">
              <Eye size={16} /> View Documentation
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-6 md:px-12 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.5 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
              <div className="font-['Exo_2'] font-black text-3xl text-cyan-400 mb-1">{s.value}</div>
              <div className="text-xs text-slate-400 font-mono">{s.label}</div>
              <div className="text-xs text-slate-500 font-mono">{s.suffix}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-['Exo_2'] font-bold text-3xl text-center text-white mb-2">Platform Capabilities</h2>
          <p className="text-slate-500 text-center text-sm mb-10 font-mono">Enterprise-grade modules for research, education & operations</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.5 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.03] transition-all duration-200">
                <f.icon size={22} className={`${f.color} mb-4`} />
                <h3 className="font-['Exo_2'] font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="relative z-10 px-6 md:px-12 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-['Exo_2'] font-bold text-3xl text-center text-white mb-2">Choose Your Portal</h2>
          <p className="text-slate-500 text-center text-sm mb-10 font-mono">Role-based access with tailored interfaces</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map((r) => (
              <button key={r.role} onClick={() => { setSelectedRole(r.role); setLoginOpen(true); }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-left hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all duration-200 group">
                <r.icon size={20} className="text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-['Exo_2'] font-semibold text-white text-sm mb-1">{r.label}</div>
                <div className="text-slate-500 text-xs leading-relaxed">{r.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 md:px-12 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-mono">
          <span>© 2025 TwinSphere — Adeseun Ogundoyin Polytechnic, Eruwa, Oyo State</span>
          <span>Industry 4.0 · IoT · Digital Twin · Real-Time Simulation</span>
        </div>
      </footer>

      {/* Login Modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => { setLoginOpen(false); setLoginError(""); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#071428] shadow-[0_0_100px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center">
                  <Lock size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-['Exo_2'] font-bold text-lg text-white leading-tight">Sign In to TwinSphere</h3>
                  <p className="text-slate-600 text-[11px] font-mono">Adeseun Ogundoyin Polytechnic</p>
                </div>
              </div>
              <button onClick={() => { setLoginOpen(false); setLoginError(""); }} className="text-slate-600 hover:text-white transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Email Address</label>
                <input value={email} onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && document.getElementById("login-btn")?.click()}
                  placeholder="yourname@aop.edu.ng"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Password</label>
                <input id="login-password" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && document.getElementById("login-btn")?.click()}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/[0.08] border border-red-500/20">
                  <AlertCircle size={13} className="text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-xs font-mono">{loginError}</span>
                </div>
              )}

              <button id="login-btn" disabled={loggingIn}
                onClick={() => {
                  const result = authenticate(email, password, loadRegisteredUsers());
                  if (!result.ok) { setLoginError(result.reason ?? "Login failed"); return; }
                  setLoggingIn(true);
                  setTimeout(() => {
                    setLoggingIn(false);
                    setLoginOpen(false);
                    setLoginError("");
                    onLogin(result.role!, result.name!);
                  }, 800);
                }}
                className={`w-full py-3.5 rounded-xl font-['Exo_2'] font-bold text-[15px] transition-all flex items-center justify-center gap-2 mt-2
                  ${loggingIn ? "bg-cyan-500/40 text-[#030d1e]/60 cursor-wait" : "bg-cyan-500 text-[#030d1e] hover:bg-cyan-400 shadow-[0_0_28px_rgba(0,212,255,0.25)]"}`}>
                {loggingIn ? <><RefreshCw size={15} className="animate-spin" /> Authenticating…</> : <>Sign In <ArrowRight size={15} /></>}
              </button>

              <p className="text-center text-[11px] text-slate-700 font-mono pt-1">
                No account?{" "}
                <button onClick={() => { setLoginOpen(false); onNavigate("register"); }} className="text-cyan-500 hover:text-cyan-400 transition-colors">Register here</button>
              </p>
            </div>

            {/* Demo hint */}
            {/* <div className="px-8 pb-6">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] font-mono text-slate-600 mb-2 uppercase tracking-widest">Demo Accounts</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { label: "Admin", email: "a.musa@aop.edu.ng" },
                    { label: "Lecturer", email: "o.adewale@aop.edu.ng" },
                    { label: "Student", email: "adekola.o@aop.edu.ng" },
                    { label: "Researcher", email: "f.ibrahim@aop.edu.ng" },
                  ].map(d => (
                    <button key={d.label} onClick={() => { setEmail(d.email); setPassword(DEMO_PASSWORD); setLoginError(""); }}
                      className="text-left group">
                      <span className="text-[10px] font-mono text-slate-600 group-hover:text-cyan-400 transition-colors">
                        {d.label}: {d.email}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-700 font-mono mt-2">Password for all: <span className="text-cyan-600">aop2025</span></p>
              </div>
            </div> */}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Shared Public Nav ────────────────────────────────────────────────────────

function PublicNav({ current, onNavigate }: { current: Page; onNavigate: (p: Page) => void }) {
  const links: { id: Page; label: string }[] = [
    { id: "landing", label: "Home" },
    { id: "features", label: "Features" },
    { id: "documentation", label: "Documentation" },
    { id: "research", label: "Research" },
    { id: "register", label: "Register" },
  ];
  return (
    <nav className="sticky top-0 z-30 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/[0.05] bg-[#030d1e]/90 backdrop-blur-md">
      <button onClick={() => onNavigate("landing")} className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
          <GitBranch size={14} className="text-white" />
        </div>
        <span className="font-['Exo_2'] font-bold text-white">TwinSphere</span>
        <span className="hidden md:inline text-xs text-cyan-400/60 font-mono">by AOP</span>
      </button>
      <div className="hidden md:flex items-center gap-1">
        {links.map(l => (
          <button key={l.id} onClick={() => onNavigate(l.id)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${current === l.id ? "text-cyan-400 bg-cyan-500/10" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"}`}>
            {l.label}
          </button>
        ))}
      </div>
      <button onClick={() => onNavigate("register")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-[#030d1e] text-sm font-semibold font-['Exo_2'] hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,212,255,0.2)]">
        Get Started
      </button>
    </nav>
  );
}

// ─── Features Page ────────────────────────────────────────────────────────────

function FeaturesPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const features = [
    {
      icon: GitBranch, color: "#00d4ff", tag: "CORE MODULE",
      title: "Digital Twin Management",
      subtitle: "Full lifecycle virtual model control",
      desc: "Create, clone, version and synchronize digital replicas of any physical system. Each twin maintains its own metadata, version history, sensor mapping, and accuracy metrics with real-time fidelity scoring.",
      bullets: ["Version control & rollback to any snapshot", "Twin template library with 20+ presets", "Clone, fork & federate across campuses", "Live accuracy tracking with drift detection"],
      image: "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=900&h=560&fit=crop&auto=format",
      imageAlt: "Digital dashboard with data visualization",
    },
    {
      icon: Radio, color: "#8b5cf6", tag: "IoT LAYER",
      title: "Multi-Protocol IoT Integration",
      subtitle: "MQTT · WebSocket · REST · CSV",
      desc: "Connect any physical sensor through industry-standard protocols. Ingestion pipelines handle temperature, voltage, current, vibration, pressure, humidity and custom metrics with configurable sampling from 100ms upward.",
      bullets: ["Mosquitto MQTT broker integration", "WebSocket live stream at sub-second latency", "CSV & JSON batch upload support", "Simulated sensor injection for testing"],
      image: "https://images.unsplash.com/photo-1562408590-e32931084e23?w=900&h=560&fit=crop&auto=format",
      imageAlt: "Blue circuit board close-up",
    },
    {
      icon: Activity, color: "#10b981", tag: "SIMULATION ENGINE",
      title: "Real-Time Simulation Hub",
      subtitle: "Multi-scenario concurrent simulation",
      desc: "Run complex multi-scenario simulations on top of live digital twin models. Pause, replay, compare scenarios side-by-side, and inject fault conditions to test system resilience without risking physical equipment.",
      bullets: ["Pause, resume & replay with full state capture", "Side-by-side scenario comparison", "Fault injection & stress testing", "Auto-generated simulation summary reports"],
      image: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=900&h=560&fit=crop&auto=format",
      imageAlt: "Monitoring screen with live analytics",
    },
    {
      icon: Brain, color: "#f59e0b", tag: "AI/ML ENGINE",
      title: "Predictive Analytics & AI",
      subtitle: "Random Forest · LSTM · Isolation Forest",
      desc: "Embedded ML models continuously analyse sensor streams to detect anomalies, forecast equipment failure, and score system health. Models train on historical data and update incrementally as new readings arrive.",
      bullets: ["Fault prediction with 94.7% accuracy", "Equipment health score (0–100)", "Anomaly detection via Isolation Forest", "Trend forecasting up to 90 days ahead"],
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&h=560&fit=crop&auto=format",
      imageAlt: "Performance analytics graphs on laptop screen",
    },
    {
      icon: Shield, color: "#ef4444", tag: "ENTERPRISE SECURITY",
      title: "Zero-Trust Security Architecture",
      subtitle: "OWASP · RBAC · JWT · 2FA",
      desc: "Enterprise-grade security from the ground up. Every request is authenticated with short-lived JWT tokens, rate-limited, input-validated, and logged. Role-based access ensures each user sees only what their role permits.",
      bullets: ["JWT + rotating refresh tokens", "RBAC with 4 built-in roles & custom permissions", "TOTP two-factor authentication", "Full audit trail with tamper-evident logs"],
      image: "https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?w=900&h=560&fit=crop&auto=format",
      imageAlt: "Electronic circuit boards",
    },
    {
      icon: FileText, color: "#06b6d4", tag: "REPORTING",
      title: "Report Generation & Export",
      subtitle: "PDF · Excel · CSV · Scheduled",
      desc: "Generate professional simulation summaries, equipment health reports, and trend analyses on demand or on a schedule. Export any dataset in CSV or Excel for downstream analysis in your preferred tools.",
      bullets: ["One-click PDF simulation reports", "Excel exports with formatted tables & charts", "Scheduled weekly/monthly report delivery", "Sharable report links with expiry control"],
      image: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=900&h=560&fit=crop&auto=format",
      imageAlt: "Solar panels under blue sky",
    },
  ];

  const specs = [
    { category: "Sensor Throughput", value: "100,000 readings/sec" },
    { category: "Sync Latency", value: "< 50ms (WebSocket)" },
    { category: "API Endpoints", value: "87 REST endpoints" },
    { category: "Supported Protocols", value: "MQTT, WSS, HTTP/2, gRPC" },
    { category: "ML Model Accuracy", value: "94.7% (Random Forest)" },
    { category: "Data Retention", value: "365 days (configurable)" },
    { category: "Uptime SLA", value: "99.9% target" },
    { category: "Concurrent Simulations", value: "Up to 50 per instance" },
  ];

  return (
    <div className="min-h-screen bg-[#030d1e] text-[#e2e8f0]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav current="features" onNavigate={onNavigate} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1606206873764-fd15e242df52?w=1400&h=600&fit=crop&auto=format"
            alt="Industrial robotic arm in blue-lit factory" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030d1e]/60 via-[#030d1e]/40 to-[#030d1e]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Platform Capabilities — Version 2.0
          </div>
          <h1 className="font-['Exo_2'] font-black text-5xl md:text-6xl text-white mb-5 leading-tight">
            Every Feature You Need<br />
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">to Run Industry 4.0</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            TwinSphere delivers a complete stack — from IoT ingestion through digital twin synchronization
            to predictive analytics — purpose-built for polytechnic research and smart campus operations.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16 space-y-24">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
            <div className={i % 2 === 1 ? "lg:col-start-2" : ""}>
              <div className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest mb-4" style={{ color: f.color }}>
                <f.icon size={12} /> {f.tag}
              </div>
              <h2 className="font-['Exo_2'] font-bold text-3xl text-white mb-2">{f.title}</h2>
              <p className="text-slate-400 text-sm font-mono mb-4">{f.subtitle}</p>
              <p className="text-slate-400 leading-relaxed mb-6">{f.desc}</p>
              <ul className="space-y-2.5">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: f.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] aspect-video ${i % 2 === 1 ? "lg:col-start-1" : ""}`} style={{ boxShadow: `0 0 60px ${f.color}18` }}>
              <img src={f.image} alt={f.imageAlt} className="w-full h-full object-cover" />
            </div>
          </motion.div>
        ))}
      </section>

      {/* Technical specs */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <h2 className="font-['Exo_2'] font-bold text-3xl text-white text-center mb-2">Technical Specifications</h2>
        <p className="text-slate-500 text-center text-sm font-mono mb-10">Production-grade performance benchmarks</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specs.map((s) => (
            <div key={s.category} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center">
              <div className="font-['Exo_2'] font-bold text-cyan-400 text-lg mb-1">{s.value}</div>
              <div className="text-xs text-slate-500 font-mono">{s.category}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 py-20 text-center">
        <h2 className="font-['Exo_2'] font-bold text-3xl text-white mb-4">Ready to get started?</h2>
        <p className="text-slate-400 mb-8">Create your account and access the full platform in minutes.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => onNavigate("register")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-[#030d1e] font-['Exo_2'] font-bold hover:bg-cyan-400 transition-all shadow-[0_0_24px_rgba(0,212,255,0.3)]">
            Register Now <ArrowRight size={16} />
          </button>
          <button onClick={() => onNavigate("documentation")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-slate-300 hover:border-cyan-500/30 hover:text-cyan-400 transition-all">
            Read the Docs
          </button>
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}

// ─── Documentation Page ───────────────────────────────────────────────────────

function DocumentationPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [activeSection, setActiveSection] = useState("quickstart");

  const sections = [
    { id: "quickstart", label: "Quick Start" },
    { id: "architecture", label: "Architecture" },
    { id: "api", label: "API Reference" },
    { id: "iot", label: "IoT Setup" },
    { id: "security", label: "Security" },
    { id: "deployment", label: "Deployment" },
  ];

  const Code = ({ children }: { children: string }) => (
    <pre className="bg-[#040e20] border border-cyan-500/10 rounded-lg p-4 text-xs font-mono text-cyan-300 overflow-x-auto my-3 leading-relaxed">{children}</pre>
  );

  const H3 = ({ children }: { children: React.ReactNode }) => (
    <h3 className="font-['Exo_2'] font-semibold text-white text-lg mt-8 mb-3">{children}</h3>
  );

  const P = ({ children }: { children: React.ReactNode }) => (
    <p className="text-slate-400 leading-relaxed mb-4 text-sm">{children}</p>
  );

  const content: Record<string, React.ReactNode> = {
    quickstart: (
      <div>
        <div className="rounded-xl overflow-hidden mb-8 border border-white/[0.06]">
          <img src="https://images.unsplash.com/photo-1640163561331-1b68a6474957?w=900&h=400&fit=crop&auto=format"
            alt="Student at computer workstation" className="w-full h-48 object-cover opacity-70" />
        </div>
        <H3>1. Create Your Account</H3>
        <P>Register at the platform using your AOP institutional email address. Select your role (Student, Lecturer, Researcher, or Administrator) and await approval from your department administrator.</P>
        <H3>2. Connect Your First Device</H3>
        <P>Navigate to Devices & Sensors → Register Device. Choose your protocol (MQTT is recommended for live hardware) and configure the connection parameters:</P>
        <Code>{`# Example MQTT device registration
Device Name:    "Temp Node — Lab 1"
Protocol:       MQTT
Broker:         mqtt.aop-campus.edu.ng:8883
Topic:          aop/eee/lab1/temperature
Auth:           TLS + username/password
Sampling Rate:  1000ms`}</Code>
        <H3>3. Create a Digital Twin</H3>
        <P>Go to Twin Models → New Twin. Give it a name, select the system type, and map your registered sensors to the twin's virtual sensor schema.</P>
        <Code>{`POST /api/v1/twins
Authorization: Bearer {token}

{
  "name": "EEE Lab 1 Twin",
  "type": "Electrical System",
  "description": "Power distribution switchgear",
  "sensors": ["dev001", "dev002"],
  "template": "electrical-v2"
}`}</Code>
        <H3>4. Launch a Simulation</H3>
        <P>With a twin active and sensors streaming, navigate to Simulations → New Simulation. Select your twin, define the scenario parameters, and click Start.</P>
        <Code>{`POST /api/v1/simulations
{
  "twin_id": "dt001",
  "name": "Power Load Surge Analysis",
  "scenarios": 3,
  "duration_minutes": 120,
  "fault_injection": false
}`}</Code>
        <H3>5. View Results</H3>
        <P>Switch to the AI Analytics page to view the ML model predictions generated from your simulation data. Reports are auto-generated on completion and available for download in PDF and Excel formats.</P>
      </div>
    ),
    architecture: (
      <div>
        <H3>System Architecture Overview</H3>
        <P>TwinSphere follows a clean microservice-ready architecture with separated concerns across four primary layers.</P>
        <div className="rounded-xl border border-white/[0.06] bg-[#040e20] p-6 font-mono text-xs text-slate-400 my-6 leading-loose">
          <div className="text-cyan-400 mb-3">── TwinSphere Platform Architecture ──────────────────────</div>
          <div>┌─────────────────────────────────────────────────────┐</div>
          <div>│  PRESENTATION LAYER  (React 18 + Vite + Tailwind)   │</div>
          <div>│  Student │ Lecturer │ Researcher │ Admin portals      │</div>
          <div>└────────────────────────┬────────────────────────────┘</div>
          <div>                         │ HTTPS / WSS</div>
          <div>┌────────────────────────▼────────────────────────────┐</div>
          <div>│  APPLICATION LAYER  (NestJS + TypeScript)            │</div>
          <div>│  Auth │ Twins │ Devices │ Simulations │ Reports       │</div>
          <div>└──────────┬─────────────────────────┬────────────────┘</div>
          <div>           │ Prisma ORM               │ Socket.IO</div>
          <div>┌──────────▼──────────┐  ┌───────────▼────────────────┐</div>
          <div>│  DATA LAYER         │  │  IoT LAYER                 │</div>
          <div>│  PostgreSQL         │  │  Mosquitto MQTT Broker     │</div>
          <div>│  Redis Cache        │  │  WebSocket Gateway         │</div>
          <div>└─────────────────────┘  └────────────────────────────┘</div>
          <div>                                   │</div>
          <div>                    ┌──────────────▼──────────────┐</div>
          <div>                    │  AI/ML SERVICE (FastAPI)     │</div>
          <div>                    │  Scikit-Learn │ TensorFlow   │</div>
          <div>                    └──────────────────────────────┘</div>
        </div>
        <H3>Key Design Principles</H3>
        <P><strong className="text-white">Clean Architecture</strong> — Dependencies point inward. Domain entities have no framework dependencies. Use cases orchestrate domain logic independently.</P>
        <P><strong className="text-white">Event-Driven Synchronization</strong> — Sensor readings publish to an internal event bus. Twin state updates, alert checks, and ML inference all consume these events asynchronously.</P>
        <P><strong className="text-white">CQRS for Simulations</strong> — Write (command) and read (query) paths are separated for simulation state to support high-throughput concurrent scenario execution.</P>
      </div>
    ),
    api: (
      <div>
        <H3>Authentication</H3>
        <Code>{`# Login
POST /api/v1/auth/login
{
  "email": "a.musa@aop.edu.ng",
  "password": "••••••••"
}
# Response
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "dGhpcyBpcyBh...",
  "expires_in": 900,
  "user": { "id": "uuid", "role": "admin" }
}`}</Code>
        <H3>Digital Twins</H3>
        <Code>{`GET    /api/v1/twins           # List all twins
POST   /api/v1/twins           # Create twin
GET    /api/v1/twins/:id       # Get twin details
PATCH  /api/v1/twins/:id       # Update twin
DELETE /api/v1/twins/:id       # Soft-delete twin
POST   /api/v1/twins/:id/clone # Clone twin
GET    /api/v1/twins/:id/versions # Version history`}</Code>
        <H3>Sensor Readings</H3>
        <Code>{`GET  /api/v1/sensors/:id/readings
     ?from=2025-01-01T00:00:00Z
     &to=2025-01-22T23:59:59Z
     &metric=temperature
     &resolution=5m      # 1m / 5m / 1h / 1d
# Response
{
  "sensor_id": "dev001",
  "metric": "temperature",
  "unit": "°C",
  "readings": [
    { "ts": "2025-01-22T10:00:00Z", "value": 24.3 },
    ...
  ]
}`}</Code>
        <H3>Simulations</H3>
        <Code>{`POST   /api/v1/simulations          # Create & start
GET    /api/v1/simulations/:id      # Get status
PATCH  /api/v1/simulations/:id/pause
PATCH  /api/v1/simulations/:id/resume
DELETE /api/v1/simulations/:id/stop
GET    /api/v1/simulations/:id/results`}</Code>
        <H3>Predictions</H3>
        <Code>{`POST /api/v1/predictions/run
{
  "twin_id": "dt005",
  "model": "random_forest",    # or "isolation_forest", "linear_regression"
  "horizon_days": 30,
  "metrics": ["vibration", "temperature"]
}
# Response
{
  "health_score": 79.2,
  "fault_probability": 0.31,
  "forecast": [...],
  "anomalies": [...]
}`}</Code>
      </div>
    ),
    iot: (
      <div>
        <div className="rounded-xl overflow-hidden mb-8 border border-white/[0.06]">
          <img src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=900&h=350&fit=crop&auto=format"
            alt="Circuit board flat lay" className="w-full h-44 object-cover opacity-70" />
        </div>
        <H3>MQTT Broker Configuration</H3>
        <P>The platform uses an Eclipse Mosquitto broker with TLS mutual authentication. Devices must present a valid client certificate to publish.</P>
        <Code>{`# /etc/mosquitto/mosquitto.conf
listener 8883
cafile   /etc/mosquitto/certs/ca.crt
certfile /etc/mosquitto/certs/server.crt
keyfile  /etc/mosquitto/certs/server.key
require_certificate true
allow_anonymous false
password_file /etc/mosquitto/passwd`}</Code>
        <H3>Topic Schema</H3>
        <Code>{`# Format: aop/{building}/{room}/{metric}
aop/eee/lab1/temperature
aop/eee/lab1/voltage
aop/building-a/hvac/humidity
aop/rooftop/solar/irradiance
aop/generator-room/vibration
# JSON payload
{
  "value": 24.3,
  "unit": "°C",
  "ts": "2025-01-22T10:30:00.000Z",
  "device_id": "dev001"
}`}</Code>
        <H3>WebSocket Live Stream</H3>
        <Code>{`// JavaScript client
const ws = new WebSocket(
  'wss://ws.aop-campus.edu.ng/live',
  [], { headers: { Authorization: 'Bearer ' + token } }
);
ws.onmessage = (e) => {
  const { sensor_id, metric, value, ts } = JSON.parse(e.data);
  console.log(\`\${sensor_id} \${metric}: \${value}\`);
};
// Subscribe to specific twin
ws.send(JSON.stringify({ action: 'subscribe', twin_id: 'dt001' }));`}</Code>
      </div>
    ),
    security: (
      <div>
        <H3>Authentication Flow</H3>
        <P>All API requests require a short-lived JWT access token (15-minute TTL). Clients use a longer-lived refresh token (7 days) to obtain new access tokens without re-authentication.</P>
        <Code>{`# Token refresh
POST /api/v1/auth/refresh
{
  "refresh_token": "dGhpcyBpcyBh..."
}
# TOTP 2FA verification
POST /api/v1/auth/2fa/verify
{
  "totp_code": "123456"
}`}</Code>
        <H3>Role-Based Access Control</H3>
        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Permission", "Admin", "Lecturer", "Student", "Researcher"].map(h => (
                  <th key={h} className="py-2 px-3 text-left text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Manage Users", "✓", "✗", "✗", "✗"],
                ["Create Twins", "✓", "✓", "✓", "✓"],
                ["Start Simulation", "✓", "✓", "✓ (own)", "✓"],
                ["View All Data", "✓", "✓", "✗", "✓"],
                ["Export Datasets", "✓", "✓", "✗", "✓"],
                ["System Config", "✓", "✗", "✗", "✗"],
                ["Audit Logs", "✓", "✗", "✗", "✗"],
              ].map(row => (
                <tr key={row[0]} className="border-b border-white/[0.03]">
                  {row.map((cell, j) => (
                    <td key={j} className={`py-2 px-3 ${j === 0 ? "text-slate-300" : cell === "✓" ? "text-emerald-400" : "text-slate-600"}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <H3>Rate Limiting</H3>
        <Code>{`# Default limits (configurable per role)
Authentication:  10 req/min per IP
API endpoints:   300 req/min per user
Sensor ingest:   10,000 msg/sec per device
Report export:   20 req/hour per user`}</Code>
      </div>
    ),
    deployment: (
      <div>
        <H3>Docker Compose (Local Dev)</H3>
        <Code>{`# docker-compose.yml (excerpt)
services:
  api:
    image: twinsphere/api:latest
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/twinsphere
      REDIS_URL:    redis://redis:6379
      JWT_SECRET:   ${"`"}openssl rand -base64 32${"`"}
    ports: ["3000:3000"]
  db:
    image: postgres:16-alpine
  redis:
    image: redis:7-alpine
  mqtt:
    image: eclipse-mosquitto:2
  ai:
    image: twinsphere/ai-service:latest
    ports: ["8000:8000"]`}</Code>
        <H3>Environment Variables</H3>
        <Code>{`# Required
DATABASE_URL        postgresql connection string
REDIS_URL           redis connection string
JWT_SECRET          min 32 chars random string
MQTT_BROKER_URL     mqtt://host:1883
# Optional
SMTP_HOST           email notifications
AWS_S3_BUCKET       report storage
CLOUDINARY_URL      device image uploads
SENTRY_DSN          error tracking`}</Code>
        <H3>Railway Deployment</H3>
        <Code>{`# One-command deploy
railway up
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set DATABASE_URL=$RAILWAY_POSTGRESQL_URL`}</Code>
      </div>
    ),
  };

  return (
    <div className="min-h-screen bg-[#030d1e] text-[#e2e8f0]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav current="documentation" onNavigate={onNavigate} />
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 flex-shrink-0">
          <div className="sticky top-24">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">Contents</p>
            <nav className="space-y-0.5">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeSection === s.id ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="mt-8 p-4 rounded-xl bg-violet-500/5 border border-violet-500/10">
              <p className="text-xs text-slate-500 mb-2">Need help?</p>
              <p className="text-xs text-slate-400">Contact ICT Services at ict@aop.edu.ng</p>
            </div>
          </div>
        </aside>
        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-8">
            {sections.map((s, i) => (
              <React.Fragment key={s.id}>
                <button onClick={() => setActiveSection(s.id)}
                  className={`text-sm transition-colors ${activeSection === s.id ? "text-cyan-400 font-medium" : "text-slate-600 hover:text-slate-400"}`}>
                  {s.label}
                </button>
                {i < sections.length - 1 && <ChevronRight size={14} className="text-slate-700" />}
              </React.Fragment>
            ))}
          </div>
          <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <h1 className="font-['Exo_2'] font-bold text-3xl text-white mb-2">
              {sections.find(s => s.id === activeSection)?.label}
            </h1>
            <div className="h-px bg-gradient-to-r from-cyan-500/30 to-transparent mb-8" />
            {content[activeSection]}
          </motion.div>
        </main>
      </div>
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}

// ─── Research Page ────────────────────────────────────────────────────────────

function ResearchPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const papers = [
    { title: "Real-Time Digital Twin Synchronization for Smart Campus Power Systems", authors: "Adewale O., Ibrahim F., Musa A.", journal: "IEEE Access", year: "2025", status: "Published" },
    { title: "Predictive Maintenance via Isolation Forest on IoT-Enabled Generator Systems", authors: "Akinleye Y., Oduola A.", journal: "Applied Energy", year: "2025", status: "Under Review" },
    { title: "MQTT-Based Sensor Fusion Architecture for Multi-Domain Digital Twins", authors: "Balogun B., Ibrahim F.", journal: "Sensors MDPI", year: "2024", status: "Published" },
    { title: "Industry 4.0 Adoption in Nigerian Polytechnics: A Framework for IoT-Driven Education", authors: "Musa A., Adewale O., Akinleye Y.", journal: "ACOJET", year: "2024", status: "Published" },
  ];

  const objectives = [
    { no: "01", title: "Real-Time Model Fidelity", desc: "Achieve <50ms synchronization latency between physical sensors and digital twin state across all monitored systems." },
    { no: "02", title: "Predictive Accuracy", desc: "Train and validate ML models achieving >90% fault-prediction accuracy on historical campus equipment data." },
    { no: "03", title: "Student Engagement", desc: "Measure the impact of interactive digital twin simulations on student understanding of engineering systems." },
    { no: "04", title: "Scalability Validation", desc: "Demonstrate the platform handling 50+ concurrent simulations across 6 twin models without performance degradation." },
  ];

  const results = [
    { metric: "Sync Latency", achieved: "38ms avg", target: "< 50ms", met: true },
    { metric: "ML Accuracy", achieved: "94.7%", target: "> 90%", met: true },
    { metric: "Student Satisfaction", achieved: "4.6 / 5.0", target: "> 4.0", met: true },
    { metric: "Concurrent Sims", achieved: "47 stable", target: "50 target", met: false },
    { metric: "System Uptime", achieved: "99.2%", target: "99.9% SLA", met: false },
    { metric: "Data Accuracy", achieved: "97.3% avg", target: "> 95%", met: true },
  ];

  return (
    <div className="min-h-screen bg-[#030d1e] text-[#e2e8f0]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav current="research" onNavigate={onNavigate} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=1400&h=500&fit=crop&auto=format"
            alt="Researcher at microscope" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030d1e]/60 to-[#030d1e]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-mono mb-6">
            <FlaskConical size={11} /> Research Division — AOP Eruwa
          </div>
          <h1 className="font-['Exo_2'] font-black text-5xl text-white mb-5 leading-tight max-w-3xl">
            Advancing Industry 4.0<br />
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Through Applied Research</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            The TwinSphere Research Programme at Adeseun Ogundoyin Polytechnic investigates
            real-time IoT-driven digital twin systems as instruments for transforming engineering
            education and smart campus infrastructure.
          </p>
        </div>
      </section>

      {/* Research objectives */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <h2 className="font-['Exo_2'] font-bold text-3xl text-white mb-2">Research Objectives</h2>
        <p className="text-slate-500 font-mono text-sm mb-10">Four primary goals guiding the study</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {objectives.map((o) => (
            <motion.div key={o.no} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }} viewport={{ once: true }}
              className="p-6 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="font-['Exo_2'] font-black text-4xl text-cyan-400/20 mb-3">{o.no}</div>
              <h3 className="font-['Exo_2'] font-semibold text-white mb-2">{o.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{o.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Methodology */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-['Exo_2'] font-bold text-3xl text-white mb-4">Research Methodology</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              This study employs a mixed-methods approach combining quantitative performance benchmarking
              with qualitative user-experience evaluation across four iterative development cycles.
            </p>
            <div className="space-y-4">
              {[
                { phase: "Phase 1", title: "Requirements Analysis", desc: "Literature review, stakeholder interviews with 12 lecturers and 48 students, existing system audit." },
                { phase: "Phase 2", title: "System Design & Implementation", desc: "Architecture design, digital twin models, IoT integration, ML model training on campus data." },
                { phase: "Phase 3", title: "Deployment & Testing", desc: "Campus-wide deployment, usability testing (n=60), performance benchmarks, security audit." },
                { phase: "Phase 4", title: "Evaluation & Publication", desc: "Statistical analysis of results, comparison with existing systems, journal submission." },
              ].map((p) => (
                <div key={p.phase} className="flex gap-4">
                  <div className="flex-shrink-0 w-16 text-right">
                    <span className="text-[10px] font-mono text-cyan-400">{p.phase}</span>
                  </div>
                  <div className="flex-1 pb-4 border-l border-cyan-500/15 pl-4">
                    <div className="font-medium text-slate-300 text-sm mb-0.5">{p.title}</div>
                    <div className="text-slate-500 text-xs leading-relaxed">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
            <img src="https://images.unsplash.com/photo-1581093577421-f561a654a353?w=800&h=600&fit=crop&auto=format"
              alt="Engineer at research workstation" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-16">
        <h2 className="font-['Exo_2'] font-bold text-3xl text-white mb-2">Key Results</h2>
        <p className="text-slate-500 font-mono text-sm mb-8">Performance benchmarks vs. stated objectives</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {results.map((r) => (
            <div key={r.metric} className={`p-5 rounded-xl border ${r.met ? "border-emerald-500/15 bg-emerald-500/[0.03]" : "border-amber-500/15 bg-amber-500/[0.02]"}`}>
              <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${r.met ? "text-emerald-400" : "text-amber-400"}`}>
                {r.met ? "✓ TARGET MET" : "△ IN PROGRESS"}
              </div>
              <div className="font-['Exo_2'] font-black text-2xl text-white mb-1">{r.achieved}</div>
              <div className="text-xs text-slate-500 font-mono">{r.metric}</div>
              <div className="text-[10px] text-slate-600 font-mono mt-1">Target: {r.target}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Publications */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12 pb-20">
        <h2 className="font-['Exo_2'] font-bold text-3xl text-white mb-2">Publications</h2>
        <p className="text-slate-500 font-mono text-sm mb-8">Research outputs from the TwinSphere project</p>
        <div className="space-y-3">
          {papers.map((p) => (
            <div key={p.title} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-start gap-5">
              <div className="flex-shrink-0 w-12 text-center">
                <div className="font-mono text-xl font-black text-violet-400">{p.year}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-200 text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-slate-500 font-mono mb-2">{p.authors}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono">{p.journal}</span>
                  <Badge color={p.status === "Published" ? "green" : "amber"}>{p.status}</Badge>
                </div>
              </div>
              <button onClick={() => downloadPublication(p)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono px-2 py-1 rounded-lg hover:bg-cyan-500/10">
                <Download size={12} /> Download
              </button>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}

// ─── Register Page ────────────────────────────────────────────────────────────

function RegisterPage({ onNavigate, onLogin, onRegister }: { onNavigate: (p: Page) => void; onLogin: (role: Role, name: string) => void; onRegister: (u: UserRecord) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", dept: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const roleCards = [
    {
      role: "admin" as Role,
      title: "Administrator",
      subtitle: "System Management",
      desc: "Full platform control — manage users, configure devices, monitor all digital twins, and access audit logs.",
      image: "https://images.unsplash.com/photo-1666875753105-c63a6f3bdc86?w=600&h=400&fit=crop&auto=format",
      imageAlt: "System dashboard with monitoring",
      perks: ["Full user & role management", "Device & sensor configuration", "System settings & audit logs", "All portal access"],
      color: "#ef4444",
      accent: "border-red-500/30 bg-red-500/[0.03]",
      badge: "bg-red-500/10 text-red-400 border-red-500/20",
    },
    {
      role: "lecturer" as Role,
      title: "Lecturer",
      subtitle: "Education & Instruction",
      desc: "Create and manage simulations, guide students through digital twin experiments, generate reports and assess results.",
      image: "https://images.unsplash.com/photo-1581093577421-f561a654a353?w=600&h=400&fit=crop&auto=format",
      imageAlt: "Engineer at workstation",
      perks: ["Create simulation projects", "Manage assigned students", "Upload learning resources", "Generate & share reports"],
      color: "#f59e0b",
      accent: "border-amber-500/30 bg-amber-500/[0.03]",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      role: "student" as Role,
      title: "Student",
      subtitle: "Learning & Exploration",
      desc: "Join simulations, build virtual models, monitor live sensor data, and download reports for your coursework.",
      image: "https://images.unsplash.com/photo-1556636530-6b7482d80e3d?w=600&h=400&fit=crop&auto=format",
      imageAlt: "Student working at computer",
      perks: ["Join lecturer simulations", "Create personal twin models", "Real-time sensor dashboards", "Download & submit reports"],
      color: "#10b981",
      accent: "border-emerald-500/30 bg-emerald-500/[0.03]",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    {
      role: "researcher" as Role,
      title: "Researcher",
      subtitle: "Advanced Analytics",
      desc: "Run advanced simulations, test ML models, export raw datasets, compare scenarios, and publish research results.",
      image: "https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?w=600&h=400&fit=crop&auto=format",
      imageAlt: "Researcher at microscope",
      perks: ["Advanced simulation controls", "ML model testing & tuning", "Full dataset export (CSV/Excel)", "Historical analytics access"],
      color: "#8b5cf6",
      accent: "border-violet-500/30 bg-violet-500/[0.03]",
      badge: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    },
  ];

  const departments = ["Electrical/Electronics Eng.", "Mechanical Engineering", "Civil Engineering", "Computer Science / ICT", "Applied Sciences", "Environmental Studies", "Business Administration", "Other"];

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.includes("@")) e.email = "Valid email required";
    if (!form.dept) e.dept = "Select a department";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      const newUser: UserRecord = {
        id: `reg_${Date.now()}`,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        role: selectedRole!,
        status: "pending",
        dept: form.dept,
        phone: form.phone,
        lastLogin: "Never",
        registeredAt: new Date().toLocaleString(),
      };
      const existing = loadRegisteredUsers();
      saveRegisteredUsers([...existing, newUser]);
      onRegister(newUser);
      setSubmitting(false);
      setStep(3);
    }, 1800);
  }

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 4 : 3;
  const pwColors = ["", "bg-red-400", "bg-amber-400", "bg-cyan-400", "bg-emerald-400"];
  const pwLabels = ["", "Weak", "Fair", "Strong", "Excellent"];

  const selected = roleCards.find(r => r.role === selectedRole);

  return (
    <div className="min-h-screen bg-[#030d1e] text-[#e2e8f0]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <PublicNav current="register" onNavigate={onNavigate} />

      {/* Step indicator */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 pt-10 pb-6">
        <div className="flex items-center gap-0 mb-10">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-2.5 transition-all ${step >= s ? "opacity-100" : "opacity-30"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-['Exo_2'] border-2 transition-all
                  ${step > s ? "bg-cyan-500 border-cyan-500 text-[#030d1e]" : step === s ? "border-cyan-500 text-cyan-400" : "border-slate-700 text-slate-600"}`}>
                  {step > s ? <CheckCircle size={14} /> : s}
                </div>
                <span className={`text-sm font-medium hidden md:block ${step === s ? "text-white" : "text-slate-500"}`}>
                  {s === 1 ? "Select Role" : s === 2 ? "Your Details" : "Complete"}
                </span>
              </div>
              {s < 3 && <div className={`flex-1 h-px mx-4 ${step > s ? "bg-cyan-500/50" : "bg-white/[0.05]"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1 — Role selection */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <h1 className="font-['Exo_2'] font-black text-4xl text-white mb-2">Choose Your Role</h1>
            <p className="text-slate-400 text-sm mb-8">Your role determines your permissions and the portal you access on TwinSphere.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {roleCards.map((rc) => (
                <button key={rc.role} onClick={() => setSelectedRole(rc.role)}
                  className={`text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 group
                    ${selectedRole === rc.role ? rc.accent + " scale-[1.01] shadow-[0_0_40px_rgba(0,0,0,0.4)]" : "border-white/[0.06] bg-white/[0.01] hover:border-white/10"}`}
                  style={{ borderColor: selectedRole === rc.role ? rc.color + "50" : undefined }}>
                  <div className="relative h-44 overflow-hidden bg-slate-900">
                    <img src={rc.image} alt={rc.imageAlt} className="w-full h-full object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030d1e] via-transparent to-transparent" />
                    {selectedRole === rc.role && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: rc.color }}>
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-['Exo_2'] font-bold text-lg text-white">{rc.title}</h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${rc.badge}`}>{rc.subtitle}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">{rc.desc}</p>
                    <ul className="space-y-1.5">
                      {rc.perks.map(p => (
                        <li key={p} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: rc.color }} />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button onClick={() => selectedRole && setStep(2)} disabled={!selectedRole}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-['Exo_2'] font-bold transition-all
                  ${selectedRole ? "bg-cyan-500 text-[#030d1e] hover:bg-cyan-400 shadow-[0_0_24px_rgba(0,212,255,0.25)]" : "bg-white/[0.05] text-slate-600 cursor-not-allowed"}`}>
                Continue as {selected?.title ?? "…"} <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Personal details */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep(1)} className="p-2 rounded-lg border border-white/[0.06] text-slate-400 hover:text-white transition-colors">
                <ChevronLeft size={16} />
              </button>
              <div>
                <h1 className="font-['Exo_2'] font-black text-3xl text-white">Create Your Account</h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Registering as <span className="font-semibold" style={{ color: selected?.color }}>{selected?.title}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "firstName", label: "First Name", placeholder: "Adekola" },
                    { key: "lastName", label: "Last Name", placeholder: "Oduola" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">{f.label}</label>
                      <input value={(form as Record<string, string>)[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className={`w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-slate-200 text-sm placeholder-slate-700 focus:outline-none transition-colors
                          ${errors[f.key] ? "border-red-500/40 focus:border-red-500/60" : "border-white/[0.07] focus:border-cyan-500/40"}`} />
                      {errors[f.key] && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors[f.key]}</p>}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Institutional Email</label>
                  <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="yourname@aop.edu.ng"
                    className={`w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-slate-200 text-sm placeholder-slate-700 focus:outline-none transition-colors
                      ${errors.email ? "border-red-500/40" : "border-white/[0.07] focus:border-cyan-500/40"}`} />
                  {errors.email && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Department</label>
                    <select value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-slate-200 text-sm focus:outline-none transition-colors cursor-pointer
                        ${errors.dept ? "border-red-500/40" : "border-white/[0.07] focus:border-cyan-500/40"}`}>
                      <option value="" className="bg-[#071428]">Select department…</option>
                      {departments.map(d => <option key={d} value={d} className="bg-[#071428]">{d}</option>)}
                    </select>
                    {errors.dept && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.dept}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Phone (optional)</label>
                    <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+234 800 000 0000"
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-200 text-sm placeholder-slate-700 focus:outline-none focus:border-cyan-500/40 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      placeholder="Minimum 8 characters"
                      className={`w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-slate-200 text-sm placeholder-slate-700 focus:outline-none transition-colors
                        ${errors.password ? "border-red-500/40" : "border-white/[0.07] focus:border-cyan-500/40"}`} />
                    {form.password.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i <= pwStrength ? pwColors[pwStrength] : "bg-white/[0.06]"}`} />
                        ))}
                        <span className={`text-[10px] font-mono ml-2 ${pwStrength >= 3 ? "text-emerald-400" : pwStrength === 2 ? "text-amber-400" : "text-red-400"}`}
                          style={{ opacity: pwStrength > 0 ? 1 : 0 }}>
                          {pwLabels[pwStrength]}
                        </span>
                      </div>
                    )}
                    {errors.password && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                    <input type="password" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                      placeholder="Repeat password"
                      className={`w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-slate-200 text-sm placeholder-slate-700 focus:outline-none transition-colors
                        ${errors.confirm ? "border-red-500/40" : form.confirm && form.confirm === form.password ? "border-emerald-500/40" : "border-white/[0.07] focus:border-cyan-500/40"}`} />
                    {errors.confirm && <p className="text-red-400 text-[10px] mt-1 font-mono">{errors.confirm}</p>}
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={submitting}
                  className={`w-full py-3.5 rounded-xl font-['Exo_2'] font-bold text-base transition-all flex items-center justify-center gap-2
                    ${submitting ? "bg-cyan-500/40 text-[#030d1e]/60 cursor-wait" : "bg-cyan-500 text-[#030d1e] hover:bg-cyan-400 shadow-[0_0_30px_rgba(0,212,255,0.25)]"}`}>
                  {submitting ? <><RefreshCw size={16} className="animate-spin" /> Creating account…</> : <>Create Account <ArrowRight size={16} /></>}
                </button>
                <p className="text-center text-xs text-slate-600 font-mono">
                  Already have an account?{" "}
                  <button onClick={() => onNavigate("landing")} className="text-cyan-400 hover:text-cyan-300 transition-colors">Sign in</button>
                </p>
              </div>
              {/* Role summary sidebar */}
              {selected && (
                <div className="hidden lg:block">
                  <div className="rounded-2xl overflow-hidden border border-white/[0.06] sticky top-24">
                    <div className="relative h-36">
                      <img src={selected.image} alt={selected.imageAlt} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071428] to-transparent" />
                    </div>
                    <div className="p-5 bg-[#071428]">
                      <div className={`text-[10px] font-mono uppercase tracking-widest mb-2`} style={{ color: selected.color }}>{selected.subtitle}</div>
                      <h3 className="font-['Exo_2'] font-bold text-white mb-3">{selected.title} Access</h3>
                      <ul className="space-y-2">
                        {selected.perks.map(p => (
                          <li key={p} className="flex items-start gap-2 text-xs text-slate-400">
                            <CheckCircle size={11} className="mt-0.5 flex-shrink-0" style={{ color: selected.color }} />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3 — Success */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="max-w-xl mx-auto text-center py-12">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <CheckCircle size={36} className="text-emerald-400" />
            </div>
            <h1 className="font-['Exo_2'] font-black text-4xl text-white mb-3">Account Created!</h1>
            <p className="text-slate-400 text-sm mb-2">
              Welcome to TwinSphere, <span className="text-white font-medium">{form.firstName} {form.lastName}</span>.
            </p>
            <p className="text-slate-500 text-xs font-mono mb-8">
              Registered as <span style={{ color: selected?.color }}>{selected?.title}</span> · {form.email}
            </p>
            <div className="p-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] text-left mb-8">
              <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-3">What happens next?</h3>
              <ul className="space-y-2.5">
                {[
                  "A verification email has been sent to your address",
                  "An administrator will approve your account within 24 hours",
                  "You will receive an email confirmation with your access details",
                  "You can then sign in and access your portal",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex-shrink-0 flex items-center justify-center text-emerald-400 font-mono text-[10px]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => onNavigate("landing")}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-[#030d1e] font-['Exo_2'] font-bold hover:bg-cyan-400 transition-all shadow-[0_0_24px_rgba(0,212,255,0.25)]">
                Go to Sign In <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate("landing")}
                className="px-6 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-sm">
                Back to Home
              </button>
            </div>
          </motion.div>
        )}
      </div>
      <PublicFooter onNavigate={onNavigate} />
    </div>
  );
}

// ─── Public Footer ────────────────────────────────────────────────────────────

function PublicFooter({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <footer className="border-t border-white/[0.04] px-6 md:px-12 py-10 bg-[#020910]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <GitBranch size={12} className="text-white" />
            </div>
            <span className="font-['Exo_2'] font-bold text-white">TwinSphere</span>
          </div>
          <p className="text-slate-600 text-xs max-w-xs leading-relaxed font-mono">
            Digital Twin Platform for Real-Time IoT Simulation.<br />
            Adeseun Ogundoyin Polytechnic, Eruwa, Oyo State.
          </p>
        </div>
        <div className="flex gap-12 text-xs font-mono">
          <div>
            <div className="text-slate-600 uppercase tracking-widest text-[10px] mb-3">Platform</div>
            <div className="space-y-2">
              {[["features","Features"],["documentation","Docs"],["research","Research"],["register","Register"]].map(([id, label]) => (
                <button key={id} onClick={() => onNavigate(id as Page)} className="block text-slate-500 hover:text-cyan-400 transition-colors">{label}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-slate-600 uppercase tracking-widest text-[10px] mb-3">Institution</div>
            <div className="space-y-2 text-slate-500">
              <div>AOP Eruwa</div>
              <div>Oyo State, Nigeria</div>
              <div>ict@aop.edu.ng</div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/[0.04] text-[10px] font-mono text-slate-700 flex items-center justify-between">
        <span>© 2025 TwinSphere — Adeseun Ogundoyin Polytechnic</span>
        <span>Industry 4.0 · IoT · Digital Twin · Real-Time Simulation</span>
      </div>
    </footer>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

// ─── Role-based Nav Config ────────────────────────────────────────────────────

type NavItem = { id: Page; icon: React.ElementType; label: string; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  admin: [
    { label: "Overview", items: [{ id: "dashboard", icon: Home, label: "Command Center" }] },
    { label: "Infrastructure", items: [
      { id: "twins", icon: GitBranch, label: "Digital Twins" },
      { id: "devices", icon: Cpu, label: "Devices & Sensors" },
      { id: "monitoring", icon: Activity, label: "Live Monitoring" },
    ]},
    { label: "Operations", items: [
      { id: "simulations", icon: FlaskConical, label: "All Simulations" },
      { id: "analytics", icon: Brain, label: "AI Analytics" },
      { id: "reports", icon: FileText, label: "Reports" },
    ]},
    { label: "Administration", items: [
      { id: "users", icon: Users, label: "User Management", badge: "!" },
      { id: "audit", icon: Terminal, label: "Audit Logs" },
      { id: "tasks", icon: ListTodo, label: "Task Board" },
      { id: "settings", icon: Settings, label: "System Settings" },
    ]},
  ],
  lecturer: [
    { label: "Portal", items: [{ id: "dashboard", icon: Home, label: "Teaching Hub" }] },
    { label: "Classroom", items: [
      { id: "users", icon: GraduationCap, label: "My Students" },
      { id: "simulations", icon: FlaskConical, label: "Simulation Projects" },
    ]},
    { label: "Lab Work", items: [
      { id: "twins", icon: GitBranch, label: "Twin Models" },
      { id: "monitoring", icon: Activity, label: "Live Monitoring" },
      { id: "devices", icon: Cpu, label: "Lab Devices" },
    ]},
    { label: "Assessment", items: [
      { id: "analytics", icon: Brain, label: "Student Analytics" },
      { id: "reports", icon: FileText, label: "Reports & Results" },
      { id: "tasks", icon: ListTodo, label: "My Tasks" },
    ]},
    { label: "Account", items: [
      { id: "settings", icon: Settings, label: "My Profile" },
    ]},
  ],
  student: [
    { label: "Portal", items: [{ id: "dashboard", icon: Home, label: "Learning Dashboard" }] },
    { label: "Coursework", items: [
      { id: "tasks", icon: ListTodo, label: "My Tasks" },
      { id: "simulations", icon: FlaskConical, label: "My Simulations" },
      { id: "twins", icon: GitBranch, label: "My Virtual Models" },
    ]},
    { label: "Live Data", items: [
      { id: "monitoring", icon: Activity, label: "Live Monitoring" },
      { id: "devices", icon: Cpu, label: "Lab Devices" },
    ]},
    { label: "Results", items: [
      { id: "reports", icon: FileText, label: "My Reports" },
    ]},
    { label: "Account", items: [
      { id: "settings", icon: Settings, label: "My Profile" },
    ]},
  ],
  researcher: [
    { label: "Portal", items: [{ id: "dashboard", icon: Home, label: "Research Hub" }] },
    { label: "Experiments", items: [
      { id: "tasks", icon: ListTodo, label: "Research Tasks" },
      { id: "simulations", icon: FlaskConical, label: "Experiments" },
      { id: "twins", icon: GitBranch, label: "Twin Models" },
      { id: "devices", icon: Cpu, label: "Sensor Network" },
      { id: "monitoring", icon: Activity, label: "Live Streams" },
    ]},
    { label: "Intelligence", items: [
      { id: "analytics", icon: Brain, label: "AI Predictions" },
      { id: "reports", icon: FileText, label: "Research Reports" },
    ]},
    { label: "Account", items: [
      { id: "settings", icon: Settings, label: "My Profile" },
    ]},
  ],
};

const ROLE_META: Record<Role, { label: string; color: string; accent: string; tagline: string; avatarBg: string }> = {
  admin: { label: "Administrator", color: "text-red-400", accent: "border-red-500/30 bg-red-500/[0.06]", tagline: "System Control", avatarBg: "from-red-500/30 to-orange-500/20" },
  lecturer: { label: "Lecturer", color: "text-amber-400", accent: "border-amber-500/30 bg-amber-500/[0.06]", tagline: "Education Portal", avatarBg: "from-amber-500/30 to-yellow-500/20" },
  student: { label: "Student", color: "text-emerald-400", accent: "border-emerald-500/30 bg-emerald-500/[0.06]", tagline: "Learning Portal", avatarBg: "from-emerald-500/30 to-teal-500/20" },
  researcher: { label: "Researcher", color: "text-violet-400", accent: "border-violet-500/30 bg-violet-500/[0.06]", tagline: "Research Portal", avatarBg: "from-violet-500/30 to-purple-500/20" },
};

function Sidebar({ page, onNav, collapsed, onCollapse, role, onLogout, extraUsers, mobileOpen, onMobileClose, userName }: {
  page: Page; onNav: (p: Page) => void; collapsed: boolean;
  onCollapse: () => void; role: Role; onLogout: () => void; extraUsers: UserRecord[];
  mobileOpen?: boolean; onMobileClose?: () => void; userName?: string;
}) {
  const meta = ROLE_META[role];
  const navGroups = NAV_BY_ROLE[role];
  const pendingCount = extraUsers.filter(u => u.status === "pending").length;

  const activeColor: Record<Role, string> = {
    admin: "text-red-400 bg-red-500/[0.08] border-r-2 border-red-400",
    lecturer: "text-amber-400 bg-amber-500/[0.08] border-r-2 border-amber-400",
    student: "text-emerald-400 bg-emerald-500/[0.08] border-r-2 border-emerald-400",
    researcher: "text-violet-400 bg-violet-500/[0.08] border-r-2 border-violet-400",
  };

  return (
    <aside className={`h-full flex flex-col border-r border-white/[0.05] transition-all duration-300
      ${collapsed ? "w-16" : "w-60"}
      fixed md:relative z-40 md:z-auto top-0 left-0
      ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      style={{ background: "linear-gradient(180deg, #040e20 0%, #030c1a 100%)" }}>
      {/* Logo + role banner */}
      <div className={`flex items-center ${collapsed ? "justify-center px-0 py-4" : "gap-2.5 px-4 py-4"} border-b border-white/[0.05]`}>
        <div className={`w-8 h-8 flex-shrink-0 rounded-xl bg-gradient-to-br ${meta.avatarBg} border border-white/[0.08] flex items-center justify-center`}>
          <GitBranch size={15} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-['Exo_2'] font-bold text-sm text-white leading-tight whitespace-nowrap">TwinSphere</div>
            <div className={`font-mono text-[10px] whitespace-nowrap ${meta.color}`}>{meta.tagline}</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
        {navGroups.map((g) => (
          <div key={g.label} className="mb-0.5">
            {!collapsed && (
              <div className="px-4 pt-3 pb-1 text-[9px] font-mono text-slate-700 uppercase tracking-widest">{g.label}</div>
            )}
            {g.items.map((item) => {
              const active = page === item.id;
              const showBadge = item.badge === "!" && pendingCount > 0 && role === "admin";
              return (
                <button key={item.id} onClick={() => { onNav(item.id); onMobileClose?.(); }}
                  className={`w-full flex items-center ${collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-2.5"} text-sm transition-all duration-150
                    ${active ? activeColor[role] : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"}`}
                  title={collapsed ? item.label : undefined}>
                  <item.icon size={15} className="flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium whitespace-nowrap flex-1 text-left text-[13px]">{item.label}</span>
                  )}
                  {!collapsed && showBadge && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-[#030d1e] text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                      {pendingCount}
                    </span>
                  )}
                  {collapsed && showBadge && (
                    <span className="absolute right-1.5 top-1.5 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/[0.05] p-3 space-y-1">
        {!collapsed && (
          <div className={`px-2 py-2.5 rounded-xl border ${meta.accent} mb-2`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${meta.avatarBg} flex items-center justify-center text-xs font-bold font-['Exo_2'] ${meta.color}`}>
                {userName ? userName.charAt(0).toUpperCase() : (role === "admin" ? "AD" : role === "lecturer" ? "LC" : role === "student" ? "ST" : "RS")}
              </div>
              <div className="overflow-hidden">
                <div className={`text-xs font-['Exo_2'] font-bold ${meta.color} truncate`}>{userName ? userName.split(" ")[0] : meta.label}</div>
                <div className="text-[10px] text-slate-600 font-mono truncate">{meta.label} · AOP Eruwa</div>
              </div>
            </div>
          </div>
        )}
        <button onClick={onLogout}
          className={`w-full flex items-center ${collapsed ? "justify-center py-2" : "gap-2 px-2 py-2"} text-slate-600 hover:text-red-400 text-sm transition-colors rounded-lg hover:bg-red-500/[0.05]`}>
          <LogOut size={14} />
          {!collapsed && <span className="text-xs">Sign Out</span>}
        </button>
        <button onClick={onCollapse}
          className={`w-full flex items-center ${collapsed ? "justify-center py-2" : "gap-2 px-2 py-2"} text-slate-700 hover:text-slate-500 text-xs transition-colors`}>
          {collapsed ? <ChevronRight size={13} /> : <><ChevronLeft size={13} /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ page, notifCount, onNotifClick, role, isDark, onTheme, onMobileNav, userName }: {
  page: Page; notifCount: number; onNotifClick: () => void;
  role: Role; isDark: boolean; onTheme: () => void; onMobileNav?: () => void; userName?: string;
}) {
  const meta = ROLE_META[role];
  const navGroups = NAV_BY_ROLE[role];
  const allItems = navGroups.flatMap(g => g.items);
  const currentItem = allItems.find(i => i.id === page);
  const pageName = currentItem?.label ?? "Dashboard";

  const greetingByRole: Record<Role, string> = {
    admin: "System operational · All services nominal",
    lecturer: "Good to see you · Your students are online",
    student: "Keep learning · 2 simulations pending review",
    researcher: "Lab systems ready · 3 experiments in progress",
  };

  return (
    <header className="flex items-center gap-3 px-3 md:px-5 py-3 border-b border-white/[0.05] bg-[#040e20]/90 backdrop-blur-sm">
      <button onClick={onMobileNav} className="md:hidden p-2 rounded-lg text-slate-500 hover:text-white transition-colors flex-shrink-0">
        <Menu size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-['Exo_2'] font-bold text-[15px] text-white leading-tight">{pageName}</h1>
          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${meta.accent} ${meta.color} hidden md:inline`}>
            {meta.label}
          </span>
        </div>
        <p className="text-[10px] font-mono text-slate-600 truncate">{greetingByRole[role]}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="relative hidden lg:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input placeholder="Search…"
            className="w-44 pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-xs text-slate-400 placeholder-slate-700 focus:outline-none focus:border-white/10 transition-colors" />
        </div>
        <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${ROLE_META[role].accent}`}>
          <div className={`w-1.5 h-1.5 rounded-full bg-current ${ROLE_META[role].color} animate-pulse`} />
          <span className={`text-[10px] font-mono capitalize ${ROLE_META[role].color}`}>{ROLE_META[role].label}</span>
        </div>
        <button onClick={onTheme} className="p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] transition-all">
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button onClick={onNotifClick} className="relative p-2 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.04] transition-all">
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${meta.avatarBg} border border-white/[0.08] flex items-center justify-center text-[11px] font-bold font-['Exo_2'] ${meta.color}`}>
          {userName ? userName.charAt(0).toUpperCase() : (role === "admin" ? "AD" : role === "lecturer" ? "LC" : role === "student" ? "ST" : "RS")}
        </div>
      </div>
    </header>
  );
}

// ─── Shared chart helper ──────────────────────────────────────────────────────

function ActivityFeed({ items }: { items: { id: string; type: AlertType; message: string; time: string; read: boolean }[] }) {
  const iconMap: Record<AlertType, { Icon: React.ElementType; color: string }> = {
    warning: { Icon: AlertTriangle, color: "text-amber-400" },
    success: { Icon: CheckCircle, color: "text-emerald-400" },
    error: { Icon: AlertCircle, color: "text-red-400" },
    info: { Icon: Bell, color: "text-cyan-400" },
  };
  return (
    <div className="space-y-3">
      {items.map((n) => {
        const { Icon, color } = iconMap[n.type];
        return (
          <div key={n.id} className="flex items-start gap-3">
            <Icon size={13} className={`${color} mt-0.5 flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs leading-relaxed ${n.read ? "text-slate-500" : "text-slate-300"}`}>{n.message}</p>
              <span className="text-[10px] font-mono text-slate-600">{n.time}</span>
            </div>
            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ sensorData, extraUsers, onNav, userName }: { sensorData: SensorPoint[]; extraUsers: UserRecord[]; onNav: (p: Page) => void; userName: string }) {
  const uid = React.useId();
  const cid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const pendingUsers = extraUsers.filter(u => u.status === "pending");
  const totalUsers = USERS.length + extraUsers.length;

  const systemStats = [
    { label: "Total Users", value: totalUsers, unit: "", icon: Users, color: "text-red-400", bg: "bg-red-500/10", delta: `${pendingUsers.length} pending approval` },
    { label: "Active Twins", value: 4, unit: "/ 6", icon: GitBranch, color: "text-cyan-400", bg: "bg-cyan-500/10", delta: "2 inactive" },
    { label: "Sensors Online", value: 42, unit: "/ 46", icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10", delta: "91.3% uptime" },
    { label: "System Alerts", value: 3, unit: "", icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", delta: "1 critical" },
  ];

  const roleBreakdown = [
    { role: "Admin", count: USERS.filter(u => u.role === "admin").length + extraUsers.filter(u => u.role === "admin").length, color: "#ef4444" },
    { role: "Lecturer", count: USERS.filter(u => u.role === "lecturer").length + extraUsers.filter(u => u.role === "lecturer").length, color: "#f59e0b" },
    { role: "Student", count: USERS.filter(u => u.role === "student").length + extraUsers.filter(u => u.role === "student").length, color: "#10b981" },
    { role: "Researcher", count: USERS.filter(u => u.role === "researcher").length + extraUsers.filter(u => u.role === "researcher").length, color: "#8b5cf6" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Role banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-red-500/15 bg-gradient-to-r from-red-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield size={18} className="text-red-400" />
          </div>
          <div>
            <h2 className="font-['Exo_2'] font-bold text-white text-base">Welcome back, {userName.split(" ")[0]}</h2>
            <p className="text-xs text-slate-500 font-mono">Full system access · AOP TwinSphere Platform</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Dot status="active" />
          <span className="text-xs font-mono text-emerald-400">All systems operational</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((s, i) => {
          const navPages: Page[] = ["users", "twins", "monitoring", "audit"];
          return (
            <div key={s.label} className="cursor-pointer" onClick={() => onNav(navPages[i])}>
              <KpiCard label={s.label} value={s.value} unit={s.unit} icon={s.icon} color={`${s.bg} ${s.color}`} delta={s.delta} />
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live sensor chart */}
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Campus-Wide Sensor Streams</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Temperature · Humidity — live feed across all buildings</p>
            </div>
            <div className="flex items-center gap-1.5"><Dot status="active" /><span className="text-[10px] font-mono text-emerald-400">LIVE</span></div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart id={cid("sensor")} data={sensorData} margin={{ top: 2, right: 8, bottom: 2, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="temperature" stroke="#00d4ff" strokeWidth={2} fill="#00d4ff" fillOpacity={0.1} name="Temp °C" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="humidity" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.08} name="Humidity %" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* User role breakdown */}
        <GlassCard className="p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">User Distribution</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-3">{totalUsers} registered accounts</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart id={cid("roles")}>
              <Pie data={roleBreakdown} dataKey="count" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={4}>
                {roleBreakdown.map(r => <Cell key={r.role} fill={r.color} />)}
              </Pie>
              <Tooltip {...CHART_TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {roleBreakdown.map(r => (
              <div key={r.role} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-slate-400 font-mono capitalize">{r.role}</span>
                </div>
                <span className="font-mono font-semibold" style={{ color: r.color }}>{r.count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Twin accuracy */}
        <GlassCard className="p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">Twin Accuracy vs Uptime</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-3">All 6 digital twin models</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart id={cid("perf")} data={perfData} margin={{ top: 2, right: 8, bottom: 2, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="accuracy" fill="#ef4444" fillOpacity={0.8} radius={[3, 3, 0, 0]} name="Accuracy %" isAnimationActive={false} />
              <Bar dataKey="uptime" fill="#00d4ff" fillOpacity={0.6} radius={[3, 3, 0, 0]} name="Uptime %" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Pending approvals + recent audit */}
        <div className="space-y-4">
          {pendingUsers.length > 0 && (
            <GlassCard className="p-5 border-amber-500/15">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Pending Approvals</h3>
                <button onClick={() => onNav("users")} className="text-[10px] font-mono text-amber-400 hover:text-amber-300">Manage all →</button>
              </div>
              <div className="space-y-2">
                {pendingUsers.slice(0, 3).map(u => (
                  <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-500/[0.04] border border-amber-500/10">
                    <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0">
                      {u.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-300 truncate">{u.name}</div>
                      <div className="text-[10px] font-mono text-slate-600 capitalize">{u.role} · {u.dept}</div>
                    </div>
                    <Badge color="amber">pending</Badge>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
          <GlassCard className="p-5 flex-1">
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-3">Recent System Activity</h3>
            <ActivityFeed items={NOTIFS.slice(0, 4)} />
          </GlassCard>
        </div>
      </div>

      {/* Device health strip */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Device Status Overview</h3>
          <button onClick={() => onNav("devices")} className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300">View all devices →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DEVICES.slice(0, 4).map(d => (
            <div key={d.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase">{d.type.split("/")[0]}</span>
                <Dot status={d.status === "online" ? "active" : d.status === "warning" ? "warning" : "error"} />
              </div>
              <div className="text-xs font-medium text-slate-300 truncate">{d.name}</div>
              <div className="text-[10px] text-slate-600 font-mono">{d.location}</div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Lecturer Dashboard ───────────────────────────────────────────────────────

function LecturerDashboard({ sensorData, onNav, userName }: { sensorData: SensorPoint[]; onNav: (p: Page) => void; userName: string }) {
  const uid = React.useId();
  const cid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const myStudents = USERS.filter(u => u.role === "student");
  const activeSimulations = SIMULATIONS.filter(s => s.status === "running");
  const completedSimulations = SIMULATIONS.filter(s => s.status === "completed");

  const weekData = [
    { day: "Mon", sessions: 3, submissions: 2 },
    { day: "Tue", sessions: 5, submissions: 4 },
    { day: "Wed", sessions: 2, submissions: 1 },
    { day: "Thu", sessions: 6, submissions: 5 },
    { day: "Fri", sessions: 4, submissions: 3 },
    { day: "Sat", sessions: 1, submissions: 0 },
    { day: "Sun", sessions: 0, submissions: 0 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Role banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-500/15 bg-gradient-to-r from-amber-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <GraduationCap size={18} className="text-amber-400" />
          </div>
          <div>
            <h2 className="font-['Exo_2'] font-bold text-white text-base">Welcome back, {userName.split(" ")[0]}</h2>
            <p className="text-xs text-slate-500 font-mono">Lecturer Portal · AOP TwinSphere</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <div className="font-['Exo_2'] font-black text-2xl text-amber-400">{myStudents.length}</div>
            <div className="text-[10px] text-slate-500 font-mono">Students enrolled</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => onNav("users")}><KpiCard label="My Students" value={myStudents.length} icon={Users} color="bg-amber-500/10 text-amber-400" delta="3 active today" /></div>
        <div className="cursor-pointer" onClick={() => onNav("simulations")}><KpiCard label="Active Simulations" value={activeSimulations.length} icon={FlaskConical} color="bg-cyan-500/10 text-cyan-400" delta="Running now" /></div>
        <div className="cursor-pointer" onClick={() => onNav("simulations")}><KpiCard label="Completed" value={completedSimulations.length} icon={CheckCircle} color="bg-emerald-500/10 text-emerald-400" delta="This semester" /></div>
        <div className="cursor-pointer" onClick={() => onNav("tasks")}><KpiCard label="My Tasks" value={3} icon={ListTodo} color="bg-violet-500/10 text-violet-400" delta="2 due this week" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity */}
        <GlassCard className="lg:col-span-2 p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">Weekly Teaching Activity</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-3">Lab sessions vs student submissions this week</p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart id={cid("week")} data={weekData} margin={{ top: 2, right: 8, bottom: 2, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Bar dataKey="sessions" fill="#f59e0b" fillOpacity={0.8} radius={[3, 3, 0, 0]} name="Lab Sessions" isAnimationActive={false} />
              <Bar dataKey="submissions" fill="#8b5cf6" fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Submissions" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Student list */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm">My Students</h3>
            <button onClick={() => onNav("users")} className="text-[10px] font-mono text-amber-400 hover:text-amber-300">View all →</button>
          </div>
          <div className="space-y-2.5">
            {myStudents.map(s => (
              <div key={s.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors" onClick={() => onNav("users")}>
                <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0">
                  {s.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-300 truncate">{s.name}</div>
                  <div className="text-[10px] font-mono text-slate-600 truncate">{s.dept}</div>
                </div>
                <Badge color={s.status === "active" ? "green" : "red"}>{s.status}</Badge>
              </div>
            ))}
          </div>
          <button onClick={() => onNav("users")}
            className="mt-3 w-full py-2 rounded-xl border border-amber-500/20 text-amber-400 text-xs font-mono hover:bg-amber-500/[0.05] transition-all flex items-center justify-center gap-1.5">
            <Users size={12} /> View Full Student List
          </button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live sensor — for classroom monitoring */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-['Exo_2'] font-semibold text-white text-sm">EEE Lab 1 — Live Feed</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Voltage & current — active experiment</p>
            </div>
            <Dot status="active" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart id={cid("lab")} data={sensorData.slice(-24)} margin={{ top: 2, right: 8, bottom: 2, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="voltage" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.1} name="Voltage V" dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.08} name="Current A" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Active simulations */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Simulation Projects</h3>
            <button onClick={() => onNav("simulations")} className="text-[10px] font-mono text-amber-400 hover:text-amber-300">Manage →</button>
          </div>
          <div className="space-y-3">
            {SIMULATIONS.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-amber-500/20 cursor-pointer transition-all group"
                onClick={() => onNav("simulations")}>
                <SimStatusBadge status={s.status} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-300 truncate group-hover:text-white transition-colors">{s.name}</div>
                  <div className="text-[10px] font-mono text-slate-600">{s.twin} · {s.progress}%</div>
                </div>
                <div className="w-16 h-1 bg-white/[0.05] rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${s.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNav("simulations")}
            className="mt-3 w-full py-2 rounded-xl border border-amber-500/20 text-amber-400 text-xs font-mono hover:bg-amber-500/[0.05] transition-all flex items-center justify-center gap-1.5">
            <FlaskConical size={12} /> Manage All Simulations
          </button>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Student Dashboard ────────────────────────────────────────────────────────

function StudentDashboard({ sensorData, onNav, userName }: { sensorData: SensorPoint[]; onNav: (p: Page) => void; userName: string }) {
  const uid = React.useId();
  const cid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const mySimulations = SIMULATIONS.slice(0, 3);
  const progressData = [
    { week: "W1", score: 62 }, { week: "W2", score: 70 }, { week: "W3", score: 68 },
    { week: "W4", score: 75 }, { week: "W5", score: 80 }, { week: "W6", score: 78 },
    { week: "W7", score: 85 }, { week: "W8", score: 88 },
  ];

  const assignments = [
    { id: "a1", title: "EEE Lab 3 — Power Analysis Simulation", due: "Tomorrow 23:59", status: "pending", course: "EEE 401" },
    { id: "a2", title: "HVAC Twin Model Calibration", due: "In 3 days", status: "in-progress", course: "MEN 302" },
    { id: "a3", title: "Solar Panel Performance Report", due: "Next week", status: "not-started", course: "EEE 401" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/15 bg-gradient-to-r from-emerald-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <GraduationCap size={18} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-['Exo_2'] font-bold text-white text-base">Welcome back, {userName.split(" ")[0]}</h2>
            <p className="text-xs text-slate-500 font-mono">Student Portal · AOP TwinSphere</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <div className="font-['Exo_2'] font-black text-2xl text-emerald-400">88%</div>
            <div className="text-[10px] text-slate-500 font-mono">Current score</div>
          </div>
          <div className="text-right">
            <div className="font-['Exo_2'] font-black text-2xl text-cyan-400">3</div>
            <div className="text-[10px] text-slate-500 font-mono">Active tasks</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => onNav("simulations")}><KpiCard label="My Simulations" value={3} icon={FlaskConical} color="bg-emerald-500/10 text-emerald-400" delta="1 running now" /></div>
        <div className="cursor-pointer" onClick={() => onNav("twins")}><KpiCard label="Virtual Models" value={2} icon={GitBranch} color="bg-cyan-500/10 text-cyan-400" delta="Both active" /></div>
        <div className="cursor-pointer" onClick={() => onNav("reports")}><KpiCard label="Reports Ready" value={4} icon={FileText} color="bg-violet-500/10 text-violet-400" delta="2 new this week" /></div>
        <div className="cursor-pointer" onClick={() => onNav("tasks")}><KpiCard label="Active Tasks" value={3} icon={ListTodo} color="bg-amber-500/10 text-amber-400" delta="2 due this week" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress chart */}
        <GlassCard className="lg:col-span-2 p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">My Performance Progress</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-3">Weekly lab scores over the semester</p>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart id={cid("progress")} data={progressData} margin={{ top: 2, right: 8, bottom: 2, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} fill="#10b981" fillOpacity={0.12} name="Score %" dot={{ r: 3, fill: "#10b981" }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Assignments */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Upcoming Tasks</h3>
            <button onClick={() => onNav("tasks")} className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors">View all →</button>
          </div>
          <div className="space-y-3">
            {assignments.map(a => (
              <div key={a.id} className={`p-3 rounded-xl border cursor-pointer hover:brightness-110 transition-all ${a.status === "in-progress" ? "border-cyan-500/15 bg-cyan-500/[0.03]" : a.status === "pending" ? "border-amber-500/15 bg-amber-500/[0.02]" : "border-white/[0.05] bg-white/[0.01]"}`}
                onClick={() => onNav("tasks")}>
                <div className="text-[10px] font-mono text-slate-600 mb-1">{a.course}</div>
                <div className="text-xs font-medium text-slate-300 leading-snug mb-1.5">{a.title}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-600">Due: {a.due}</span>
                  <Badge color={a.status === "in-progress" ? "cyan" : a.status === "pending" ? "amber" : "slate"}>
                    {a.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNav("tasks")}
            className="mt-3 w-full py-2 rounded-xl border border-emerald-500/20 text-emerald-400 text-xs font-mono hover:bg-emerald-500/[0.05] transition-all flex items-center justify-center gap-1.5">
            <ListTodo size={12} /> Manage All Tasks
          </button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live lab data */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-['Exo_2'] font-semibold text-white text-sm">EEE Lab 1 — Live Readings</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Your assigned sensor stream</p>
            </div>
            <div className="flex items-center gap-1.5"><Dot status="active" /><span className="text-[10px] font-mono text-emerald-400">LIVE</span></div>
          </div>
          <ResponsiveContainer width="100%" height={155}>
            <LineChart id={cid("live")} data={sensorData.slice(-20)} margin={{ top: 2, right: 8, bottom: 2, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="temperature" stroke="#10b981" strokeWidth={2} dot={false} name="Temp °C" isAnimationActive={false} />
              <Line type="monotone" dataKey="voltage" stroke="#00d4ff" strokeWidth={1.5} dot={false} name="Voltage V" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* My simulations */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm">My Simulations</h3>
            <button onClick={() => onNav("simulations")} className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300">View all →</button>
          </div>
          <div className="space-y-3">
            {mySimulations.map(s => (
              <div key={s.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium text-slate-300 truncate flex-1 mr-2">{s.name}</div>
                  <SimStatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 flex-shrink-0">{s.progress}%</span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 mt-1">{s.twin}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Researcher Dashboard ─────────────────────────────────────────────────────

function ResearcherDashboard({ sensorData, onNav, userName }: { sensorData: SensorPoint[]; onNav: (p: Page) => void; userName: string }) {
  const uid = React.useId();
  const cid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const experiments = SIMULATIONS;
  const mlScores = [
    { model: "Rand. Forest", accuracy: 94.7, f1: 93.2 },
    { model: "Decision Tree", accuracy: 88.3, f1: 87.1 },
    { model: "Iso. Forest", accuracy: 91.5, f1: 89.8 },
    { model: "Lin. Regression", accuracy: 82.6, f1: 81.4 },
  ];
  const anomalyData = sensorData.slice(-30).map((d, i) => ({
    ...d,
    anomaly: i === 8 || i === 19 || i === 25 ? d.current * 1.8 : null,
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Role banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-violet-500/15 bg-gradient-to-r from-violet-500/[0.06] to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <FlaskConical size={18} className="text-violet-400" />
          </div>
          <div>
            <h2 className="font-['Exo_2'] font-bold text-white text-base">Welcome back, {userName.split(" ")[0]}</h2>
            <p className="text-xs text-slate-500 font-mono">Researcher Portal · TwinSphere Research Programme</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <div className="font-['Exo_2'] font-black text-2xl text-violet-400">94.7%</div>
            <div className="text-[10px] text-slate-500 font-mono">ML accuracy</div>
          </div>
          <div className="text-right">
            <div className="font-['Exo_2'] font-black text-2xl text-cyan-400">3</div>
            <div className="text-[10px] text-slate-500 font-mono">Active experiments</div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => onNav("simulations")}><KpiCard label="Experiments" value={experiments.length} icon={FlaskConical} color="bg-violet-500/10 text-violet-400" delta="3 running" /></div>
        <div className="cursor-pointer" onClick={() => onNav("analytics")}><KpiCard label="ML Accuracy" value={94.7} unit="%" icon={Brain} color="bg-cyan-500/10 text-cyan-400" delta="Random Forest" /></div>
        <div className="cursor-pointer" onClick={() => onNav("monitoring")}><KpiCard label="Data Points" value="1.2M" unit="" icon={Activity} color="bg-emerald-500/10 text-emerald-400" delta="Last 30 days" /></div>
        <div className="cursor-pointer" onClick={() => onNav("tasks")}><KpiCard label="Research Tasks" value={3} icon={ListTodo} color="bg-amber-500/10 text-amber-400" delta="2 due this week" /></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction chart */}
        <GlassCard className="lg:col-span-2 p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">Predictive Health Model — Generator Room</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-3">Actual vs predicted fault probability · Isolation Forest</p>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart id={cid("pred")} data={predData} margin={{ top: 2, right: 8, bottom: 2, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis domain={[65, 100]} tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} name="Actual" isAnimationActive={false} />
              <Line type="monotone" dataKey="pred" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "#8b5cf6" }} name="Predicted" isAnimationActive={false} />
              <Line type="monotone" dataKey="health" stroke="#00d4ff" strokeWidth={1.5} strokeDasharray="2 3" dot={false} name="Health Score" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* ML model comparison */}
        <GlassCard className="p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-3">ML Model Benchmark</h3>
          <div className="space-y-4">
            {mlScores.map(m => (
              <div key={m.model}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-slate-400">{m.model}</span>
                  <span className="text-xs font-bold text-violet-400">{m.accuracy}%</span>
                </div>
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${m.accuracy}%` }} />
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">F1 Score: {m.f1}%</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly detection stream */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Anomaly Detection Stream</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Vibration data · flagged anomalies highlighted</p>
            </div>
            <Badge color="violet">Isolation Forest</Badge>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart id={cid("anomaly")} data={anomalyData} margin={{ top: 2, right: 8, bottom: 2, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={4} />
              <YAxis tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="vibration" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="Vibration" isAnimationActive={false} />
              <Line type="monotone" dataKey="anomaly" stroke="#ef4444" strokeWidth={0} dot={{ r: 5, fill: "#ef4444", strokeWidth: 0 }} name="Anomaly" isAnimationActive={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Experiments table */}
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm">Active Experiments</h3>
            <button onClick={() => onNav("simulations")} className="text-[10px] font-mono text-violet-400 hover:text-violet-300">Manage →</button>
          </div>
          <div className="space-y-2.5">
            {experiments.slice(0, 4).map(e => (
              <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-violet-500/[0.03] border border-violet-500/10">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <FlaskConical size={13} className="text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-slate-300 truncate">{e.name}</div>
                  <div className="text-[10px] font-mono text-slate-600">{e.twin} · {e.scenarios} scenarios</div>
                </div>
                <SimStatusBadge status={e.status} />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Dashboard Router ─────────────────────────────────────────────────────────

function DashboardPage({ sensorData, role, extraUsers, onNav, userName }: { sensorData: SensorPoint[]; role: Role; extraUsers: UserRecord[]; onNav: (p: Page) => void; userName: string }) {
  if (role === "admin") return <AdminDashboard sensorData={sensorData} extraUsers={extraUsers} onNav={onNav} userName={userName} />;
  if (role === "lecturer") return <LecturerDashboard sensorData={sensorData} onNav={onNav} userName={userName} />;
  if (role === "student") return <StudentDashboard sensorData={sensorData} onNav={onNav} userName={userName} />;
  return <ResearcherDashboard sensorData={sensorData} onNav={onNav} userName={userName} />;
}

// ─── Digital Twins Page ───────────────────────────────────────────────────────

function TwinsPage({ role, onNav }: { role: Role; onNav: (p: Page) => void }) {
  const [search, setSearch] = useState("");
  const visibleTwins = role === "student" ? TWINS.slice(0, 2) : role === "lecturer" ? TWINS.slice(0, 4) : TWINS;
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneSource, setCloneSource] = useState<Twin | null>(null);
  const [cloneName, setCloneName] = useState("");
  const [clonedTwins, setClonedTwins] = useState<Twin[]>([]);
  const filtered = visibleTwins.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  const subtitleByRole: Record<Role, string> = {
    admin: "Manage all virtual replicas of physical campus systems",
    lecturer: "Digital twins assigned to your department",
    student: "Your assigned simulation twins for coursework",
    researcher: "All campus twins available for research experiments",
  };

  const [selected, setSelected] = useState<Twin | null>(null);

  const TWIN_DETAILS: Record<string, { protocol: string; host: string; updateHz: number; simCount: number; alerts: number }> = {
    dt001: { protocol: "MQTT/TLS", host: "mqtt.aop-campus.edu.ng", updateHz: 10, simCount: 4, alerts: 0 },
    dt002: { protocol: "WebSocket", host: "ws.aop-campus.edu.ng", updateHz: 5, simCount: 2, alerts: 0 },
    dt003: { protocol: "HTTP/REST", host: "api.aop-campus.edu.ng", updateHz: 1, simCount: 3, alerts: 1 },
    dt004: { protocol: "MQTT/TLS", host: "mqtt.aop-campus.edu.ng", updateHz: 10, simCount: 6, alerts: 0 },
    dt005: { protocol: "MQTT/TLS", host: "mqtt.aop-campus.edu.ng", updateHz: 4, simCount: 2, alerts: 2 },
    dt006: { protocol: "HTTP/REST", host: "api.aop-campus.edu.ng", updateHz: 1, simCount: 1, alerts: 0 },
  };

  return (
    <div className="p-6">
      <SectionHeader title={role === "student" ? "My Assigned Twins" : role === "lecturer" ? "Department Twins" : "Digital Twin Models"}
        subtitle={subtitleByRole[role]}
        action={
          (role === "admin" || role === "researcher" || role === "lecturer") ? (
            <button onClick={() => setCloneOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
              <Plus size={14} /> {role === "admin" ? "New Twin" : "Clone Twin"}
            </button>
          ) : null
        }
      />
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search twins…"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 transition-colors" />
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-slate-500 text-sm hover:text-slate-300 transition-colors">
          <Filter size={14} /> Filter
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...filtered, ...clonedTwins.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))].map((t) => (
          <GlassCard key={t.id} className="p-5 cursor-pointer hover:border-cyan-500/20 group transition-all" onClick={() => setSelected(t)}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                <GitBranch size={16} className="text-cyan-400" />
              </div>
              <div className="flex items-center gap-2">
                <TwinStatusBadge status={t.status} />
                <EyeIcon size={13} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
            <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1 group-hover:text-cyan-300 transition-colors">{t.name}</h3>
            <p className="text-slate-500 text-xs mb-4 leading-relaxed">{t.description}</p>
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/[0.05]">
              <div className="text-center">
                <div className="font-mono font-bold text-cyan-400 text-sm">{t.accuracy}%</div>
                <div className="text-[10px] text-slate-600 font-mono">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-slate-300 text-sm">{t.sensors}</div>
                <div className="text-[10px] text-slate-600 font-mono">Sensors</div>
              </div>
              <div className="text-center">
                <div className="font-mono font-bold text-slate-300 text-sm">{(t.dataPoints / 1000).toFixed(0)}k</div>
                <div className="text-[10px] text-slate-600 font-mono">Data Pts</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <Clock size={11} className="text-slate-600" />
              <span className="text-[10px] text-slate-600 font-mono">Last sync: {t.lastSync}</span>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }} transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md h-full bg-[#071428] border-l border-white/[0.06] overflow-y-auto shadow-[-40px_0_80px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#071428]/95 backdrop-blur-sm border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <GitBranch size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-['Exo_2'] font-bold text-white text-sm">{selected.name}</h3>
                  <TwinStatusBadge status={selected.status} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all"><X size={15} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Description */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-sm text-slate-300 leading-relaxed">{selected.description}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-2">Type: {selected.type}</p>
              </div>
              {/* Key metrics */}
              <div>
                <p className="text-[10px] font-mono text-slate-500 mb-3 uppercase tracking-widest">Performance Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Sync Accuracy", value: `${selected.accuracy}%`, color: "text-cyan-400" },
                    { label: "Active Sensors", value: String(selected.sensors), color: "text-emerald-400" },
                    { label: "Data Points", value: `${(selected.dataPoints / 1000).toFixed(0)}k`, color: "text-violet-400" },
                    { label: "Last Sync", value: selected.lastSync, color: "text-amber-400" },
                  ].map(m => (
                    <div key={m.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className={`font-mono font-bold text-lg ${m.color}`}>{m.value}</div>
                      <div className="text-[10px] font-mono text-slate-600">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Connection */}
              {TWIN_DETAILS[selected.id] && (
                <div>
                  <p className="text-[10px] font-mono text-slate-500 mb-3 uppercase tracking-widest">Connection Details</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Protocol", value: TWIN_DETAILS[selected.id].protocol },
                      { label: "Host", value: TWIN_DETAILS[selected.id].host },
                      { label: "Update Rate", value: `${TWIN_DETAILS[selected.id].updateHz} Hz` },
                      { label: "Simulations", value: `${TWIN_DETAILS[selected.id].simCount} active` },
                      { label: "Active Alerts", value: TWIN_DETAILS[selected.id].alerts === 0 ? "None" : `${TWIN_DETAILS[selected.id].alerts} alert(s)` },
                    ].map(c => (
                      <div key={c.label} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                        <span className="text-xs font-mono text-slate-500">{c.label}</span>
                        <span className={`text-xs font-mono ${c.label === "Active Alerts" && TWIN_DETAILS[selected.id].alerts > 0 ? "text-amber-400" : "text-slate-300"}`}>{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Accuracy bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sync Accuracy</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">{selected.accuracy}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${selected.accuracy}%` }} />
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setSelected(null); onNav("monitoring"); }}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-1.5">
                  <Activity size={13} /> Monitor Live
                </button>
                {(role === "admin" || role === "researcher" || role === "lecturer") && (
                  <button onClick={() => { setSelected(null); onNav("simulations"); }}
                    className="flex-1 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono hover:bg-violet-500/20 transition-all flex items-center justify-center gap-1.5">
                    <FlaskConical size={13} /> Run Simulation
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Clone / New Twin Modal */}
      {cloneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCloneOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#071428] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><GitBranch size={16} className="text-violet-400" /></div>
                <div>
                  <h3 className="font-['Exo_2'] font-bold text-white">{role === "admin" ? "New Digital Twin" : "Clone Twin Model"}</h3>
                  <p className="text-[10px] font-mono text-slate-500">Create a virtual replica for simulation</p>
                </div>
              </div>
              <button onClick={() => setCloneOpen(false)} className="text-slate-600 hover:text-white p-1 transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Source Twin *</label>
                <select value={cloneSource?.id ?? ""} onChange={e => setCloneSource(visibleTwins.find(t => t.id === e.target.value) ?? null)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-violet-500/40 transition-colors">
                  <option value="">Select source twin…</option>
                  {visibleTwins.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">New Twin Name *</label>
                <input value={cloneName} onChange={e => setCloneName(e.target.value)}
                  placeholder={cloneSource ? `${cloneSource.name} — Copy` : "Enter a name…"}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-violet-500/40 transition-colors" />
              </div>
              {cloneSource && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <p className="text-[10px] font-mono text-slate-500 mb-2">Source twin preview</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div><div className="text-cyan-400 font-mono font-bold text-sm">{cloneSource.accuracy}%</div><div className="text-[10px] text-slate-600">Accuracy</div></div>
                    <div><div className="text-slate-300 font-mono font-bold text-sm">{cloneSource.sensors}</div><div className="text-[10px] text-slate-600">Sensors</div></div>
                    <div><div className="text-slate-300 font-mono font-bold text-sm capitalize">{cloneSource.status}</div><div className="text-[10px] text-slate-600">Status</div></div>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  if (!cloneName.trim() || !cloneSource) return;
                  const clone: Twin = {
                    ...cloneSource,
                    id: `clone_${Date.now()}`,
                    name: cloneName,
                    status: "syncing",
                    lastSync: "Just now",
                    accuracy: Math.max(85, cloneSource.accuracy - 2),
                    dataPoints: 0,
                  };
                  setClonedTwins(prev => [clone, ...prev]);
                  setCloneName("");
                  setCloneSource(null);
                  setCloneOpen(false);
                }}
                disabled={!cloneName.trim() || !cloneSource}
                className="w-full py-3 rounded-xl bg-violet-500 text-white font-['Exo_2'] font-bold hover:bg-violet-400 transition-all shadow-[0_0_24px_rgba(139,92,246,0.25)] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
                <GitBranch size={15} /> {role === "admin" ? "Create Twin" : "Clone Twin"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Live Monitoring Page ─────────────────────────────────────────────────────

function MonitoringPage({ sensorData, role }: { sensorData: SensorPoint[]; role: Role }) {
  const uid = React.useId();
  const cid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const allMetrics = [
    { key: "temperature" as keyof SensorPoint, label: "Temperature", unit: "°C", color: "#00d4ff", threshold: 32, grad: "tempGr" },
    { key: "humidity" as keyof SensorPoint, label: "Humidity", unit: "%", color: "#8b5cf6", threshold: 80, grad: "humGr" },
    { key: "voltage" as keyof SensorPoint, label: "Voltage", unit: "V", color: "#f59e0b", threshold: 230, grad: "voltGr" },
    { key: "current" as keyof SensorPoint, label: "Current", unit: "A", color: "#10b981", threshold: 22, grad: "currGr" },
  ];
  const metrics = role === "student" ? allMetrics.slice(0, 2) : allMetrics;

  const latest = sensorData[sensorData.length - 1];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title={role === "student" ? "Lab Sensor View" : role === "lecturer" ? "Lab Monitoring" : "Live IoT Monitoring"}
        subtitle={role === "student" ? "Real-time readings for your assigned lab sensors" : role === "lecturer" ? "Department lab sensors — live threshold monitoring" : "All campus sensor streams with threshold alerts"}
        action={
          <div className="flex items-center gap-2">
            <Dot status="active" />
            <span className="text-xs font-mono text-emerald-400">{role === "student" ? "2 sensors" : role === "lecturer" ? "12 sensors" : "42 sensors"} streaming</span>
          </div>
        }
      />

      {/* Current readings */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const val = latest ? (latest[m.key] as number) : 0;
          const pct = Math.min(100, (val / m.threshold) * 100);
          const over = val > m.threshold * 0.9;
          return (
            <GlassCard key={m.key} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{m.label}</span>
                {over && <AlertTriangle size={12} className="text-amber-400" />}
              </div>
              <div className="font-['Exo_2'] font-black text-3xl mb-1" style={{ color: m.color }}>
                {val}<span className="text-sm text-slate-500 ml-1">{m.unit}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.04] mt-3">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: over ? "#f59e0b" : m.color }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] font-mono text-slate-600">0</span>
                <span className="text-[10px] font-mono text-slate-600">⚠ {m.threshold}{m.unit}</span>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[
          { dataKey: "temperature", label: "Temperature (°C)", color: "#00d4ff" },
          { dataKey: "humidity", label: "Humidity (%)", color: "#8b5cf6" },
          { dataKey: "voltage", label: "Voltage (V)", color: "#f59e0b" },
          { dataKey: "current", label: "Current (A)", color: "#10b981" },
        ].map((m) => (
          <GlassCard key={m.dataKey} className="p-5">
            <h3 className="font-mono text-xs text-slate-400 mb-4">{m.label}</h3>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart id={cid(m.dataKey)} data={sensorData} margin={{ top: 2, right: 8, bottom: 2, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey={m.dataKey} stroke={m.color} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlassCard>
        ))}
      </div>

      {/* Device stream table */}
      <GlassCard className="p-5">
        <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-4">Active Device Streams</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Device", "Type", "Location", "Status", "Last Seen", "Sensors"].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-mono text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEVICES.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 text-slate-300 font-medium text-xs">{d.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs font-mono">{d.type}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs">
                    <div className="flex items-center gap-1"><MapPin size={10} />{d.location}</div>
                  </td>
                  <td className="py-2.5 px-3"><DevStatusBadge status={d.status} /></td>
                  <td className="py-2.5 px-3 text-slate-500 text-xs font-mono">{d.lastSeen}</td>
                  <td className="py-2.5 px-3 text-cyan-400 text-xs font-mono font-bold">{d.sensors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Simulations Page ─────────────────────────────────────────────────────────

function SimulationsPage({ role, onNav }: { role: Role; onNav: (p: Page) => void }) {
  const allSims = SIMULATIONS;
  const visibleSims = role === "student" ? allSims.filter(s => s.status === "running" || s.status === "completed").slice(0, 3)
    : role === "lecturer" ? allSims.filter((_, i) => i < 4)
    : allSims;
  const [sims, setSims] = useState(visibleSims);
  const [newSimOpen, setNewSimOpen] = useState(false);
  const [newSimForm, setNewSimForm] = useState({ name: "", twin: "", scenarios: "1", duration: "30m" });

  const toggle = (id: string) => {
    setSims(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (s.status === "running") return { ...s, status: "paused" as SimStatus };
      if (s.status === "paused") return { ...s, status: "running" as SimStatus };
      return s;
    }));
  };

  const stop = (id: string) => {
    setSims(prev => prev.map(s => s.id === id ? { ...s, status: "stopped" as SimStatus, progress: 0 } : s));
  };

  return (
    <div className="p-6">
      <SectionHeader
        title={role === "student" ? "My Simulations" : role === "lecturer" ? "Class Simulations" : role === "researcher" ? "Research Simulations" : "Simulation Hub"}
        subtitle={role === "student" ? "Simulations assigned to you by your lecturer" : role === "lecturer" ? "Manage simulations for your students" : role === "researcher" ? "Multi-scenario experiments and parameter sweeps" : "Multi-scenario digital twin simulation management"}
        action={
          role !== "student" ? (
            <button onClick={() => setNewSimOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
              <Plus size={14} /> {role === "lecturer" ? "Assign Simulation" : "New Simulation"}
            </button>
          ) : null
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Running", count: sims.filter(s => s.status === "running").length, color: "text-emerald-400" },
          { label: "Paused", count: sims.filter(s => s.status === "paused").length, color: "text-amber-400" },
          { label: "Completed", count: sims.filter(s => s.status === "completed").length, color: "text-cyan-400" },
          { label: "Stopped", count: sims.filter(s => s.status === "stopped").length, color: "text-slate-400" },
        ].map(s => (
          <GlassCard key={s.label} className="p-4 text-center">
            <div className={`font-['Exo_2'] font-black text-2xl ${s.color}`}>{s.count}</div>
            <div className="text-[10px] font-mono text-slate-600 mt-0.5">{s.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="space-y-3">
        {sims.map((s) => (
          <GlassCard key={s.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <SimStatusBadge status={s.status} />
                  <h3 className="font-['Exo_2'] font-semibold text-white text-sm truncate">{s.name}</h3>
                </div>
                <p className="text-xs text-slate-500 font-mono mb-3">
                  {s.twin} · {s.scenarios} scenario{s.scenarios > 1 ? "s" : ""} · Created by {s.createdBy}
                </p>
                {s.status !== "stopped" && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1.5">
                      <span>Progress</span><span>{s.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${s.progress}%`,
                          backgroundColor: s.status === "completed" ? "#10b981" : s.status === "paused" ? "#f59e0b" : "#00d4ff",
                        }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right mr-2 hidden sm:block">
                  <div className="text-[10px] font-mono text-slate-600">Started</div>
                  <div className="text-xs font-mono text-slate-400">{s.startTime}</div>
                </div>
                {(s.status === "running" || s.status === "paused") && (
                  <>
                    <button onClick={() => onNav("monitoring")}
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="Monitor live">
                      <Activity size={14} />
                    </button>
                    <button onClick={() => toggle(s.id)}
                      className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all">
                      {s.status === "running" ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button onClick={() => stop(s.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                      <Square size={14} />
                    </button>
                  </>
                )}
                {s.status === "stopped" && (
                  <button onClick={() => setSims(prev => prev.map(x => x.id === s.id ? { ...x, status: "running" as SimStatus, progress: 0 } : x))}
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                    <RotateCcw size={14} />
                  </button>
                )}
                {s.status === "completed" && (
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onNav("monitoring")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs hover:bg-cyan-500/20 transition-all">
                      <Activity size={12} /> Monitor
                    </button>
                    <button onClick={() => downloadReport({ name: s.name, type: "PDF", size: "~2 MB", date: new Date().toISOString().split("T")[0], twin: s.twin })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/10 text-violet-400 text-xs hover:bg-violet-500/20 transition-all">
                      <Download size={12} /> Report
                    </button>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* New Simulation Modal */}
      {newSimOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setNewSimOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#071428] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><FlaskConical size={16} className="text-cyan-400" /></div>
                <div>
                  <h3 className="font-['Exo_2'] font-bold text-white">{role === "lecturer" ? "Assign Simulation" : "New Simulation"}</h3>
                  <p className="text-[10px] font-mono text-slate-500">Configure and launch a digital twin simulation</p>
                </div>
              </div>
              <button onClick={() => setNewSimOpen(false)} className="text-slate-600 hover:text-white p-1 transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Simulation Name *</label>
                <input value={newSimForm.name} onChange={e => setNewSimForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Power Load Surge Analysis"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Digital Twin *</label>
                <select value={newSimForm.twin} onChange={e => setNewSimForm(p => ({ ...p, twin: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                  <option value="">Select a twin…</option>
                  {TWINS.map(t => <option key={t.id} value={t.name}>{t.name} ({t.status})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Scenarios</label>
                  <select value={newSimForm.scenarios} onChange={e => setNewSimForm(p => ({ ...p, scenarios: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                    {["1","2","3","4","5"].map(n => <option key={n} value={n}>{n} scenario{n !== "1" ? "s" : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Duration</label>
                  <select value={newSimForm.duration} onChange={e => setNewSimForm(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                    {["15m","30m","1h","2h","4h","8h"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!newSimForm.name.trim() || !newSimForm.twin) return;
                  const newSim: Simulation = {
                    id: `sim_${Date.now()}`,
                    name: newSimForm.name,
                    twin: newSimForm.twin,
                    status: "running",
                    progress: 0,
                    startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    duration: newSimForm.duration,
                    createdBy: role === "lecturer" ? "Engr. Adewale" : role === "researcher" ? "Dr. Ibrahim" : "Admin",
                    scenarios: parseInt(newSimForm.scenarios),
                  };
                  setSims(prev => [newSim, ...prev]);
                  setNewSimForm({ name: "", twin: "", scenarios: "1", duration: "30m" });
                  setNewSimOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-cyan-500 text-[#030d1e] font-['Exo_2'] font-bold hover:bg-cyan-400 transition-all shadow-[0_0_24px_rgba(0,212,255,0.2)] flex items-center justify-center gap-2">
                <FlaskConical size={15} /> Launch Simulation
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

function AnalyticsPage({ sensorData, role }: { sensorData: SensorPoint[]; role: Role }) {
  const uid = React.useId();
  const cid = (s: string) => `${uid}-${s}`.replace(/:/g, "");
  const [selectedModel, setSelectedModel] = useState("Random Forest");
  const [predRunning, setPredRunning] = useState(false);
  const [lastPredRun, setLastPredRun] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title={role === "researcher" ? "Research Analytics Engine" : role === "lecturer" ? "Teaching Analytics" : "AI Predictive Analytics"}
        subtitle={role === "researcher" ? "ML model benchmarks, anomaly detection, and predictive health" : role === "lecturer" ? "Student performance trends and lab utilization metrics" : "Machine learning-based fault detection, health scoring & trend forecasting"}
        action={
          <button onClick={() => { setPredRunning(true); setTimeout(() => { setPredRunning(false); setLastPredRun(new Date().toLocaleTimeString()); }, 2200); }}
            disabled={predRunning}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-['Exo_2'] font-bold transition-all
              ${predRunning ? "bg-violet-500/20 text-violet-400 cursor-wait border border-violet-500/20" : "bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20"}`}>
            {predRunning ? <><RefreshCw size={14} className="animate-spin" /> Running…</> : <><Brain size={14} /> Run {selectedModel.split(" ")[0]}</>}
          </button>
        }
      />

      {lastPredRun && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/20 w-fit">
          <CheckCircle size={13} className="text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400">Prediction complete · {selectedModel} · {lastPredRun}</span>
        </div>
      )}

      {/* Model status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: "Random Forest", status: "Active", accuracy: "94.7%", color: "cyan" },
          { name: "Decision Tree", status: "Active", accuracy: "89.2%", color: "violet" },
          { name: "Isolation Forest", status: "Active", accuracy: "91.1%", color: "green" },
          { name: "Linear Regression", status: "Training", accuracy: "87.6%", color: "amber" },
        ].map((m) => (
          <GlassCard key={m.name} className={`p-4 cursor-pointer transition-all ${selectedModel === m.name ? "border-violet-500/40 bg-violet-500/[0.06]" : "hover:border-white/10"}`}
            onClick={() => setSelectedModel(m.name)}>
            <div className="flex items-center justify-between mb-3">
              <Brain size={16} className={selectedModel === m.name ? "text-violet-300" : "text-violet-400"} />
              <Badge color={m.color as "cyan" | "violet" | "green" | "amber"}>{m.status}</Badge>
            </div>
            <div className="font-['Exo_2'] font-semibold text-white text-sm mb-0.5">{m.name}</div>
            <div className="font-mono text-xl font-black text-violet-400">{m.accuracy}</div>
            <div className="text-[10px] text-slate-600 font-mono">validation accuracy</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction chart */}
        <GlassCard className="p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">Equipment Health Forecast</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-4">Actual vs predicted health score · Generator Room</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart id={cid("pred")} data={predData} margin={{ top: 2, right: 8, bottom: 2, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <YAxis domain={[65, 100]} tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
              <Tooltip {...CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} name="Actual" connectNulls={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="pred" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "#8b5cf6" }} name="Predicted" isAnimationActive={false} />
              <Line type="monotone" dataKey="health" stroke="#00d4ff" strokeWidth={1.5} strokeDasharray="2 3" dot={false} name="Health Score" isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Anomaly detection */}
        <GlassCard className="p-5">
          <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">Anomaly Detection Feed</h3>
          <p className="text-[11px] text-slate-500 font-mono mb-4">Isolation Forest detections — last 24h</p>
          <div className="space-y-2.5">
            {[
              { ts: "11:22:08", sensor: "Vibration — Generator", severity: "HIGH", score: 0.89 },
              { ts: "09:47:33", sensor: "Current — EEE Lab 1", severity: "MED", score: 0.62 },
              { ts: "08:15:51", sensor: "Pressure — Water Plant", severity: "LOW", score: 0.41 },
              { ts: "07:03:19", sensor: "Temp — Building A", severity: "LOW", score: 0.37 },
              { ts: "06:54:02", sensor: "Voltage — Substation", severity: "MED", score: 0.58 },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <AlertTriangle size={13} className={a.severity === "HIGH" ? "text-red-400" : a.severity === "MED" ? "text-amber-400" : "text-slate-500"} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-300 truncate">{a.sensor}</div>
                  <div className="text-[10px] font-mono text-slate-600">{a.ts}</div>
                </div>
                <Badge color={a.severity === "HIGH" ? "red" : a.severity === "MED" ? "amber" : "slate"}>{a.severity}</Badge>
                <span className="text-xs font-mono text-violet-400">{a.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Voltage trend */}
      <GlassCard className="p-5">
        <h3 className="font-['Exo_2'] font-semibold text-white text-sm mb-1">Voltage & Current Trend Analysis</h3>
        <p className="text-[11px] text-slate-500 font-mono mb-4">EEE Lab 1 — Power distribution monitoring</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart id={cid("power")} data={sensorData} margin={{ top: 2, right: 8, bottom: 2, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: "#475569", fontFamily: "JetBrains Mono" }} tickLine={false} axisLine={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="voltage" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.08} name="Voltage V" dot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="current" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.08} name="Current A" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────

function ReportsPage({ role }: { role: Role }) {
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({ name: "", twin: "Solar PV Array", type: "PDF", period: "Last 7 days" });
  const [generated, setGenerated] = useState<Array<{id:string;name:string;type:string;size:string;date:string;status:string;twin:string;forRoles:string[]}>>([]);
  const [generating, setGenerating] = useState(false);

  const allReports = [
    { id: "r1", name: "Solar Irradiance Forecast — Simulation Report", type: "PDF", size: "2.4 MB", date: "2025-01-22", status: "ready", twin: "Solar PV Array", forRoles: ["admin", "researcher", "lecturer"] },
    { id: "r2", name: "EEE Lab 1 Power Load Analysis — Historical Export", type: "Excel", size: "1.1 MB", date: "2025-01-21", status: "ready", twin: "Electrical Lab Twin", forRoles: ["admin", "lecturer", "student"] },
    { id: "r3", name: "Generator Room Predictive Maintenance Report", type: "PDF", size: "3.7 MB", date: "2025-01-20", status: "ready", twin: "Generator Room", forRoles: ["admin", "researcher"] },
    { id: "r4", name: "HVAC Fault Injection Simulation Summary", type: "PDF", size: "1.8 MB", date: "2025-01-20", status: "generating", twin: "HVAC Control Twin", forRoles: ["admin", "researcher"] },
    { id: "r5", name: "Water Treatment Plant — Monthly Analytics", type: "CSV", size: "840 KB", date: "2025-01-18", status: "ready", twin: "Water Treatment Twin", forRoles: ["admin", "researcher", "lecturer"] },
    { id: "r6", name: "Platform Usage & Performance Audit", type: "PDF", size: "920 KB", date: "2025-01-15", status: "ready", twin: "System", forRoles: ["admin"] },
    { id: "r7", name: "My Simulation Results — EEE 302 Assignment", type: "PDF", size: "420 KB", date: "2025-01-22", status: "ready", twin: "Electrical Lab Twin", forRoles: ["student"] },
    { id: "r8", name: "Research Experiment #12 — Anomaly Detection Output", type: "CSV", size: "1.2 MB", date: "2025-01-21", status: "ready", twin: "Generator Room", forRoles: ["researcher"] },
  ];
  const reports = [...allReports.filter(r => r.forRoles.includes(role)), ...generated];

  return (
    <div className="p-6">
      <SectionHeader
        title={role === "student" ? "My Reports" : role === "lecturer" ? "Class Reports" : role === "researcher" ? "Research Outputs" : "Reports & Exports"}
        subtitle={role === "student" ? "Your simulation and assignment result exports" : role === "lecturer" ? "Department simulation summaries and student results" : role === "researcher" ? "Experiment outputs, analytics exports, and research data" : "Generate, download and share simulation and analytics reports"}
        action={
          role !== "student" ? (
            <button onClick={() => setGenOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
              <Plus size={14} /> {role === "lecturer" ? "Export Results" : "Generate Report"}
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Reports", value: String(reports.length + 16), icon: FileText, color: "text-cyan-400" },
          { label: "Generated Today", value: String(3 + generated.length), icon: RefreshCw, color: "text-emerald-400" },
          { label: "Total Size", value: "84.2 MB", icon: HardDrive, color: "text-violet-400" },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4 flex items-center gap-4">
            <s.icon size={20} className={s.color} />
            <div>
              <div className="font-['Exo_2'] font-bold text-xl text-white">{s.value}</div>
              <div className="text-[11px] font-mono text-slate-500">{s.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Report Name", "Twin / Source", "Type", "Size", "Date", "Status", ""].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-mono text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-slate-300 text-xs font-medium">{r.name}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{r.twin}</td>
                  <td className="py-3 px-4">
                    <Badge color={r.type === "PDF" ? "red" : r.type === "Excel" ? "green" : "cyan"}>{r.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{r.size}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{r.date}</td>
                  <td className="py-3 px-4">
                    {r.status === "ready"
                      ? <Badge color="green">Ready</Badge>
                      : <Badge color="amber">Generating…</Badge>
                    }
                  </td>
                  <td className="py-3 px-4">
                    {r.status === "ready" && (
                      <button onClick={() => downloadReport(r)}
                        className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors px-2 py-1 rounded-lg hover:bg-cyan-500/10">
                        <Download size={12} /> Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Generate Report Modal */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setGenOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#071428] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><FileText size={16} className="text-cyan-400" /></div>
                <div>
                  <h3 className="font-['Exo_2'] font-bold text-white">Generate New Report</h3>
                  <p className="text-[10px] font-mono text-slate-500">Export simulation data and analytics</p>
                </div>
              </div>
              <button onClick={() => setGenOpen(false)} className="text-slate-600 hover:text-white p-1 transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Report Name *</label>
                <input value={genForm.name} onChange={e => setGenForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Monthly Power Analysis"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Twin / Data Source</label>
                <select value={genForm.twin} onChange={e => setGenForm(p => ({ ...p, twin: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                  {TWINS.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Format</label>
                  <select value={genForm.type} onChange={e => setGenForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                    <option>PDF</option><option>Excel</option><option>CSV</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Period</label>
                  <select value={genForm.period} onChange={e => setGenForm(p => ({ ...p, period: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                    <option>Last 24 hours</option><option>Last 7 days</option><option>Last 30 days</option><option>This semester</option>
                  </select>
                </div>
              </div>
              <button disabled={generating || !genForm.name.trim()}
                onClick={() => {
                  setGenerating(true);
                  setTimeout(() => {
                    setGenerated(prev => [{
                      id: `gr_${Date.now()}`, name: genForm.name, type: genForm.type,
                      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
                      date: new Date().toISOString().split("T")[0], status: "ready",
                      twin: genForm.twin, forRoles: [role],
                    }, ...prev]);
                    setGenerating(false);
                    setGenOpen(false);
                    setGenForm(p => ({ ...p, name: "" }));
                  }, 2000);
                }}
                className={`w-full py-3 rounded-xl font-['Exo_2'] font-bold flex items-center justify-center gap-2 transition-all
                  ${generating || !genForm.name.trim() ? "bg-cyan-500/30 text-[#030d1e]/50 cursor-not-allowed" : "bg-cyan-500 text-[#030d1e] hover:bg-cyan-400 shadow-[0_0_24px_rgba(0,212,255,0.2)]"}`}>
                {generating ? <><RefreshCw size={15} className="animate-spin" /> Generating…</> : <><FileText size={15} /> Generate Report</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Devices Page ─────────────────────────────────────────────────────────────

function DevicesPage({ role }: { role: Role }) {
  const canManage = role === "admin" || role === "lecturer";
  const visibleDevices = role === "student" ? DEVICES.slice(0, 3) : role === "lecturer" ? DEVICES.slice(0, 5) : DEVICES;
  const [statusFilter, setStatusFilter] = useState<"all" | DeviceStatus>("all");
  const [selectedDev, setSelectedDev] = useState<Device | null>(null);

  const filtered = visibleDevices.filter(d => statusFilter === "all" ? true : d.status === statusFilter);
  const online = visibleDevices.filter(d => d.status === "online").length;
  const warning = visibleDevices.filter(d => d.status === "warning").length;
  const offline = visibleDevices.filter(d => d.status === "offline").length;

  return (
    <div className="p-6">
      <SectionHeader
        title={role === "student" ? "Lab Equipment" : role === "researcher" ? "Research Devices" : "Devices & Sensors"}
        subtitle={role === "student" ? "Sensors in your assigned lab — read-only view" : role === "researcher" ? "Sensor registry for your research experiment setup" : "IoT hardware registry — MQTT / HTTP / WebSocket connections"}
        action={
          canManage ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
              <Plus size={14} /> Register Device
            </button>
          ) : null
        }
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Online", value: online, color: "text-emerald-400", dot: "bg-emerald-400", status: "online" as DeviceStatus },
          { label: "Warning", value: warning, color: "text-amber-400", dot: "bg-amber-400", status: "warning" as DeviceStatus },
          { label: "Offline", value: offline, color: "text-slate-400", dot: "bg-slate-600", status: "offline" as DeviceStatus },
        ].map(s => (
          <GlassCard key={s.label} className={`p-4 flex items-center gap-3 cursor-pointer transition-all ${statusFilter === s.status ? "border-cyan-500/30" : ""}`}
            onClick={() => setStatusFilter(statusFilter === s.status ? "all" : s.status)}>
            <div className="relative">
              <div className={`w-3 h-3 rounded-full ${s.dot}`} />
              {s.status === "online" && <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />}
            </div>
            <div>
              <div className={`font-['Exo_2'] font-black text-xl ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-mono text-slate-600">{s.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Device", "Type", "Location", "Status", "Sensors", "Firmware", "Last Seen", ""].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-mono text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setSelectedDev(d)}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <Dot status={d.status} />
                        {d.status === "online" && <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />}
                      </div>
                      <span className="text-slate-300 text-xs font-medium group-hover:text-cyan-300 transition-colors">{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{d.type}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    <div className="flex items-center gap-1"><MapPin size={10} />{d.location}</div>
                  </td>
                  <td className="py-3 px-4"><DevStatusBadge status={d.status} /></td>
                  <td className="py-3 px-4 text-cyan-400 font-mono text-xs font-bold">{d.sensors}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{d.firmware}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{d.lastSeen}</td>
                  <td className="py-3 px-4">
                    <EyeIcon size={13} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Device detail modal */}
      {selectedDev && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDev(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#071428] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Cpu size={18} className="text-cyan-400" />
                  </div>
                  {selectedDev.status === "online" && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#071428]" />}
                </div>
                <div>
                  <h3 className="font-['Exo_2'] font-bold text-white text-sm">{selectedDev.name}</h3>
                  <DevStatusBadge status={selectedDev.status} />
                </div>
              </div>
              <button onClick={() => setSelectedDev(null)} className="text-slate-600 hover:text-white p-1 transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Device Type", value: selectedDev.type },
                  { label: "Location", value: selectedDev.location },
                  { label: "Active Sensors", value: String(selectedDev.sensors) },
                  { label: "Firmware", value: selectedDev.firmware },
                  { label: "Last Seen", value: selectedDev.lastSeen },
                  { label: "Device ID", value: selectedDev.id.toUpperCase() },
                ].map(f => (
                  <div key={f.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-[10px] font-mono text-slate-500 mb-0.5">{f.label}</div>
                    <div className="text-xs font-mono text-slate-300">{f.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono hover:bg-cyan-500/20 transition-all flex items-center justify-center gap-1.5">
                  <Activity size={13} /> Live Data
                </button>
                {canManage && (
                  <button className="flex-1 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono hover:bg-amber-500/20 transition-all flex items-center justify-center gap-1.5">
                    <Settings size={13} /> Configure
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────

function UsersPage({ extraUsers, onUpdateExtraUsers, role = "admin" }: { extraUsers: UserRecord[]; onUpdateExtraUsers: (users: UserRecord[]) => void; role?: Role }) {
  const roleBadge: Record<Role, "cyan" | "violet" | "green" | "amber" | "red" | "slate"> = {
    admin: "red", lecturer: "amber", student: "green", researcher: "violet",
  };
  const isLecturer = role === "lecturer";
  const [filter, setFilter] = useState<"all" | Role | "pending">(isLecturer ? "student" : "all");
  const [search, setSearch] = useState("");

  const allUsers: UserRecord[] = [...USERS, ...extraUsers];

  const filtered = allUsers.filter(u => {
    const matchRole = isLecturer ? u.role === "student" : true;
    const matchFilter = filter === "all" ? true : filter === "pending" ? u.status === "pending" : u.role === filter;
    const matchSearch = search === "" || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchFilter && matchSearch;
  });

  function updateExtra(id: string, patch: Partial<UserRecord>) {
    const updated = extraUsers.map(u => u.id === id ? { ...u, ...patch } : u);
    saveRegisteredUsers(updated);
    onUpdateExtraUsers(updated);
  }

  function deleteExtra(id: string) {
    const updated = extraUsers.filter(u => u.id !== id);
    saveRegisteredUsers(updated);
    onUpdateExtraUsers(updated);
  }

  const pendingCount = extraUsers.filter(u => u.status === "pending").length;

  return (
    <div className="p-6">
      <SectionHeader
        title={isLecturer ? "My Students" : "User Management"}
        subtitle={isLecturer ? "All enrolled students with simulation and assessment progress" : "RBAC — all registered platform users including pending approvals"}
        action={
          <div className="flex items-center gap-2">
            {pendingCount > 0 && !isLecturer && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                {pendingCount} pending approval
              </div>
            )}
            {isLecturer && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                <Users size={12} />
                {filtered.length} enrolled
              </div>
            )}
          </div>
        }
      />
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={isLecturer ? "Search student name or email…" : "Search name or email…"}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-300 text-xs placeholder-slate-600 focus:outline-none focus:border-cyan-500/30 transition-colors" />
        </div>
        {!isLecturer && (
          <div className="flex gap-1 bg-white/[0.02] border border-white/[0.05] rounded-lg p-1">
            {(["all", "pending", "admin", "lecturer", "student", "researcher"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-[10px] font-mono capitalize transition-all ${filter === f ? "bg-cyan-500/15 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
                {f}
              </button>
            ))}
          </div>
        )}
        {isLecturer && (
          <div className="flex gap-1 bg-white/[0.02] border border-white/[0.05] rounded-lg p-1">
            {(["student", "active", "suspended"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f === "active" || f === "suspended" ? "student" : "student")}
                className={`px-3 py-1 rounded-md text-[10px] font-mono capitalize transition-all text-slate-500 hover:text-slate-300`}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["Name", "Email", "Role", "Department", "Status", "Registered / Login", "Actions"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-mono text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-600 text-xs font-mono">No users match filter</td></tr>
              )}
              {filtered.map((u) => {
                const isExtra = extraUsers.some(e => e.id === u.id);
                return (
                  <tr key={u.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${u.status === "pending" ? "bg-amber-500/[0.02]" : ""}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0
                          ${u.status === "pending" ? "bg-amber-500/20 text-amber-400" : "bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-400"}`}>
                          {u.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div className="text-slate-300 text-xs font-medium whitespace-nowrap">{u.name}</div>
                          {u.phone && <div className="text-slate-600 text-[10px] font-mono">{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge color={roleBadge[u.role] || "cyan"}>{u.role}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs max-w-[140px] truncate">{u.dept}</td>
                    <td className="py-3 px-4">
                      <Badge color={u.status === "active" ? "green" : u.status === "pending" ? "amber" : "red"}>{u.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[10px] font-mono">
                      {u.registeredAt ? (
                        <div>
                          <div className="text-amber-400/80">Registered:</div>
                          <div className="text-slate-600">{u.registeredAt}</div>
                        </div>
                      ) : u.lastLogin}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {isExtra && u.status === "pending" && (
                          <button onClick={() => updateExtra(u.id, { status: "active", lastLogin: "Just now" })}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all border border-emerald-500/20 whitespace-nowrap">
                            Approve
                          </button>
                        )}
                        {isExtra && u.status === "active" && (
                          <button onClick={() => updateExtra(u.id, { status: "suspended" })}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all border border-amber-500/20 whitespace-nowrap">
                            Suspend
                          </button>
                        )}
                        {isExtra && u.status === "suspended" && (
                          <button onClick={() => updateExtra(u.id, { status: "active" })}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all border border-cyan-500/20 whitespace-nowrap">
                            Restore
                          </button>
                        )}
                        {isExtra && (
                          <button onClick={() => deleteExtra(u.id)}
                            className="text-[10px] font-mono px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20">
                            Delete
                          </button>
                        )}
                        {!isExtra && (
                          <span className="text-[10px] font-mono text-slate-700">System</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 px-4 pb-2 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-600">{filtered.length} of {allUsers.length} users shown</span>
          <div className="flex gap-4 text-[10px] font-mono text-slate-600">
            <span className="text-emerald-400/70">● {allUsers.filter(u => u.status === "active").length} active</span>
            <span className="text-amber-400/70">● {allUsers.filter(u => u.status === "pending").length} pending</span>
            <span className="text-red-400/70">● {allUsers.filter(u => u.status === "suspended").length} suspended</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Audit Page ───────────────────────────────────────────────────────────────

function AuditPage() {
  return (
    <div className="p-6">
      <SectionHeader title="Audit Logs" subtitle="Complete user activity trail — authentication, data access, system changes" />
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.05]">
                {["User", "Action", "Resource", "Timestamp", "IP Address", "Result"].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[10px] font-mono text-slate-600 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT.map((a) => (
                <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-slate-300 text-xs font-medium whitespace-nowrap">{a.user}</td>
                  <td className="py-3 px-4">
                    <code className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">{a.action}</code>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono">{a.resource}</td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-mono whitespace-nowrap">{a.ts}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs font-mono">{a.ip}</td>
                  <td className="py-3 px-4">
                    <Badge color={a.ok ? "green" : "red"}>{a.ok ? "SUCCESS" : "FAILURE"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Tasks Page ───────────────────────────────────────────────────────────────

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string; border: string }> = {
  high:   { label: "High",   color: "text-red-400",    bg: "bg-red-500/[0.08]",    border: "border-red-500/20" },
  medium: { label: "Medium", color: "text-amber-400",  bg: "bg-amber-500/[0.08]",  border: "border-amber-500/20" },
  low:    { label: "Low",    color: "text-emerald-400", bg: "bg-emerald-500/[0.08]",border: "border-emerald-500/20" },
};

function TasksPage({ role, onNav }: { role: Role; onNav?: (p: Page) => void }) {
  const initialTasks = useMemo(() => {
    const saved = loadTasks();
    const seedForRole = SEED_TASKS.filter(t => t.role === role);
    const savedForRole = saved.filter(t => t.role === role);
    const seedIds = seedForRole.map(t => t.id);
    const extraSaved = savedForRole.filter(t => !seedIds.includes(t.id));
    return [...seedForRole, ...extraSaved];
  }, [role]);

  const [tasks, setTasksState] = useState<TaskRecord[]>(initialTasks);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", desc: "", due: "", priority: "medium" as TaskPriority, category: "" });

  function persist(updated: TaskRecord[]) {
    const allSaved = loadTasks().filter(t => t.role !== role);
    saveTasks([...allSaved, ...updated]);
    setTasksState(updated);
  }

  function toggleDone(id: string) {
    persist(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTask(id: string) {
    persist(tasks.filter(t => t.id !== id));
  }

  function addTask() {
    if (!newTask.title.trim()) return;
    const t: TaskRecord = {
      id: `task_${Date.now()}`,
      title: newTask.title,
      desc: newTask.desc,
      due: newTask.due || "No deadline",
      priority: newTask.priority,
      done: false,
      createdAt: new Date().toLocaleDateString(),
      role,
      category: newTask.category || "General",
    };
    persist([...tasks, t]);
    setNewTask({ title: "", desc: "", due: "", priority: "medium", category: "" });
    setAddOpen(false);
  }

  const filtered = tasks.filter(t => {
    const statusOk = filter === "all" ? true : filter === "done" ? t.done : !t.done;
    const priorityOk = priorityFilter === "all" ? true : t.priority === priorityFilter;
    return statusOk && priorityOk;
  });

  const pending = tasks.filter(t => !t.done).length;
  const done = tasks.filter(t => t.done).length;
  const high = tasks.filter(t => t.priority === "high" && !t.done).length;

  const titleByRole: Record<Role, string> = {
    admin: "Admin Task Board", lecturer: "Teaching Tasks", student: "My Coursework Tasks", researcher: "Research Tasks",
  };

  return (
    <div className="p-6">
      <SectionHeader title={titleByRole[role]} subtitle="Track your upcoming tasks, deadlines, and coursework obligations"
        action={
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all">
            <Plus size={14} /> Add Task
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", value: pending, color: "text-amber-400", icon: Clock },
          { label: "Completed", value: done, color: "text-emerald-400", icon: CheckCircle },
          { label: "High Priority", value: high, color: "text-red-400", icon: AlertCircle },
        ].map(s => (
          <GlassCard key={s.label} className="p-4 flex items-center gap-3">
            <s.icon size={20} className={s.color} />
            <div>
              <div className={`font-['Exo_2'] font-black text-2xl ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-mono text-slate-600">{s.label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          {(["all", "pending", "done"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize transition-all ${filter === f ? "bg-cyan-500/15 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          {(["all", "high", "medium", "low"] as const).map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono capitalize transition-all ${priorityFilter === p ? "bg-white/[0.08] text-white" : "text-slate-500 hover:text-slate-300"}`}>
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-600 ml-auto">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Task list */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <GlassCard className="p-8 text-center">
            <CheckSquare size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No tasks match this filter.</p>
            <button onClick={() => setAddOpen(true)} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors">+ Add your first task</button>
          </GlassCard>
        )}
        {filtered.map((t) => {
          const pm = PRIORITY_META[t.priority];
          const isOverdue = !t.done && t.due !== "No deadline" && new Date(t.due) < new Date();
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
              <GlassCard className={`p-4 transition-all ${t.done ? "opacity-50" : ""}`}>
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleDone(t.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${t.done ? "bg-emerald-500 border-emerald-500" : "border-white/20 hover:border-cyan-400"}`}>
                    {t.done && <CheckCircle size={12} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${t.done ? "line-through text-slate-500" : "text-white"}`}>{t.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${pm.color} ${pm.bg} ${pm.border}`}>{pm.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.06] text-slate-500">{t.category}</span>
                    </div>
                    {t.desc && <p className="text-xs text-slate-500 leading-relaxed mb-2">{t.desc}</p>}
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 text-[10px] font-mono ${isOverdue ? "text-red-400" : "text-slate-600"}`}>
                        <Clock size={10} />
                        {isOverdue ? "OVERDUE · " : "Due: "}{t.due}
                      </div>
                      <span className="text-[10px] font-mono text-slate-700">Added {t.createdAt}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(t.id)}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/[0.08] transition-all flex-shrink-0">
                    <X size={13} />
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Quick nav shortcuts */}
      {onNav && (
        <div className="mt-6 pt-5 border-t border-white/[0.05]">
          <p className="text-[10px] font-mono text-slate-600 mb-3 uppercase tracking-widest">Jump to related pages</p>
          <div className="flex flex-wrap gap-2">
            {role === "student" && [
              { label: "My Simulations", page: "simulations" as Page, icon: FlaskConical, color: "text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/[0.06]" },
              { label: "Virtual Models", page: "twins" as Page, icon: GitBranch, color: "text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/[0.06]" },
              { label: "Live Monitoring", page: "monitoring" as Page, icon: Activity, color: "text-violet-400 border-violet-500/20 hover:bg-violet-500/[0.06]" },
              { label: "My Reports", page: "reports" as Page, icon: FileText, color: "text-amber-400 border-amber-500/20 hover:bg-amber-500/[0.06]" },
            ].map(n => (
              <button key={n.page} onClick={() => onNav(n.page)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-all ${n.color}`}>
                <n.icon size={12} /> {n.label}
              </button>
            ))}
            {role === "lecturer" && [
              { label: "My Students", page: "users" as Page, icon: Users, color: "text-amber-400 border-amber-500/20 hover:bg-amber-500/[0.06]" },
              { label: "Simulation Projects", page: "simulations" as Page, icon: FlaskConical, color: "text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/[0.06]" },
              { label: "Reports", page: "reports" as Page, icon: FileText, color: "text-violet-400 border-violet-500/20 hover:bg-violet-500/[0.06]" },
            ].map(n => (
              <button key={n.page} onClick={() => onNav(n.page)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono transition-all ${n.color}`}>
                <n.icon size={12} /> {n.label}
              </button>
            ))}
            {(role === "admin" || role === "researcher") && [
              { label: "Simulations", page: "simulations" as Page, icon: FlaskConical },
              { label: "Twin Models", page: "twins" as Page, icon: GitBranch },
              { label: "Reports", page: "reports" as Page, icon: FileText },
            ].map(n => (
              <button key={n.page} onClick={() => onNav(n.page)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.08] text-slate-400 text-xs font-mono hover:text-white hover:border-white/20 transition-all">
                <n.icon size={12} /> {n.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add task modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setAddOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.18 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#071428] shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
              <h3 className="font-['Exo_2'] font-bold text-white">New Task</h3>
              <button onClick={() => setAddOpen(false)} className="text-slate-600 hover:text-white transition-colors"><X size={15} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Task Title *</label>
                <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Description</label>
                <textarea value={newTask.desc} onChange={e => setNewTask(p => ({ ...p, desc: e.target.value }))}
                  placeholder="Additional details…" rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Due Date</label>
                  <input type="date" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Category</label>
                <input value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value }))}
                  placeholder={role === "student" ? "e.g. Assignment, Lab Work, Study" : role === "lecturer" ? "e.g. Teaching, Assessment" : "e.g. Research, Infrastructure"}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/40 transition-colors" />
              </div>
              <button onClick={addTask}
                className="w-full py-3 rounded-xl bg-cyan-500 text-[#030d1e] font-['Exo_2'] font-bold hover:bg-cyan-400 transition-all shadow-[0_0_24px_rgba(0,212,255,0.2)]">
                Add Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function Toggle({ on, onToggle, color = "cyan" }: { on: boolean; onToggle: () => void; color?: string }) {
  return (
    <button onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${on ? (color === "cyan" ? "bg-cyan-500" : color === "emerald" ? "bg-emerald-500" : color === "violet" ? "bg-violet-500" : "bg-amber-500") : "bg-white/[0.08]"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

const NOTIF_LS_KEY = "twinsphere_notif_settings";
function loadNotifSettings() {
  try { const r = localStorage.getItem(NOTIF_LS_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveNotifSettings(s: object) { localStorage.setItem(NOTIF_LS_KEY, JSON.stringify(s)); }

function NotificationsSettings() {
  const saved = loadNotifSettings();
  const [emailOn, setEmailOn] = useState(saved?.emailOn ?? true);
  const [smsOn, setSmsOn] = useState(saved?.smsOn ?? false);
  const [inAppOn, setInAppOn] = useState(saved?.inAppOn ?? true);
  const [criticalOnly, setCriticalOnly] = useState(saved?.criticalOnly ?? false);
  const [threshold, setThreshold] = useState<"all" | "warning" | "critical">(saved?.threshold ?? "warning");
  const [emailAddr, setEmailAddr] = useState(saved?.emailAddr ?? "");
  const [phone, setPhone] = useState(saved?.phone ?? "");
  const [saved2, setSaved2] = useState(false);

  function persist(patch: object) {
    const current = loadNotifSettings() ?? {};
    saveNotifSettings({ ...current, emailOn, smsOn, inAppOn, criticalOnly, threshold, emailAddr, phone, ...patch });
  }

  function handleSave() {
    persist({ emailOn, smsOn, inAppOn, criticalOnly, threshold, emailAddr, phone });
    setSaved2(true);
    setTimeout(() => setSaved2(false), 2500);
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Email */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center"><Mail size={16} className="text-cyan-400" /></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Email Notifications</div>
            <div className="text-[10px] font-mono text-slate-500">Alerts sent to your institutional email address</div>
          </div>
          <Toggle on={emailOn} onToggle={() => { setEmailOn(!emailOn); persist({ emailOn: !emailOn }); }} color="cyan" />
        </div>
        {emailOn && (
          <div className="pt-3 border-t border-white/[0.05]">
            <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Notification Email</label>
            <input value={emailAddr} onChange={e => setEmailAddr(e.target.value)}
              placeholder="your.email@aop.edu.ng"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm font-mono focus:outline-none focus:border-cyan-500/40 transition-colors" />
            <p className="text-[10px] text-slate-600 mt-1.5 font-mono">Sent via smtp.aop.edu.ng:587 · TLS encrypted</p>
          </div>
        )}
      </GlassCard>

      {/* SMS */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Smartphone size={16} className="text-emerald-400" /></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">SMS Alerts</div>
            <div className="text-[10px] font-mono text-slate-500">Critical threshold alerts sent as text messages</div>
          </div>
          <Toggle on={smsOn} onToggle={() => { setSmsOn(!smsOn); persist({ smsOn: !smsOn }); }} color="emerald" />
        </div>
        {smsOn && (
          <div className="pt-3 border-t border-white/[0.05]">
            <label className="block text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-widest">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+234 8XX XXX XXXX"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-500/40 transition-colors" />
            <p className="text-[10px] text-slate-600 mt-1.5 font-mono">Powered by Twilio SMS gateway · MTN/Airtel/Glo supported</p>
          </div>
        )}
      </GlassCard>

      {/* In-App */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Bell size={16} className="text-violet-400" /></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">In-App Notifications</div>
            <div className="text-[10px] font-mono text-slate-500">Real-time WebSocket push alerts inside the platform</div>
          </div>
          <Toggle on={inAppOn} onToggle={() => { setInAppOn(!inAppOn); persist({ inAppOn: !inAppOn }); }} color="violet" />
        </div>
      </GlassCard>

      {/* Threshold */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Sliders size={16} className="text-amber-400" /></div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Alert Severity Threshold</div>
            <div className="text-[10px] font-mono text-slate-500">Minimum severity level to trigger notifications</div>
          </div>
        </div>
        <div className="flex gap-2">
          {(["all", "warning", "critical"] as const).map(lvl => (
            <button key={lvl} onClick={() => setThreshold(lvl)}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-mono capitalize transition-all
                ${threshold === lvl
                  ? lvl === "critical" ? "bg-red-500/15 border-red-500/30 text-red-400"
                    : lvl === "warning" ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                    : "bg-cyan-500/15 border-cyan-500/30 text-cyan-400"
                  : "border-white/[0.06] text-slate-500 hover:text-slate-300"}`}>
              {lvl === "all" ? "All Events" : lvl === "warning" ? "Warning +" : "Critical Only"}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 font-mono mt-2">
          {threshold === "all" ? "You will receive every informational, warning, and critical alert." :
           threshold === "warning" ? "You will receive warning-level and critical alerts only." :
           "You will only receive alerts for critical system failures."}
        </p>
      </GlassCard>

      <button onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-['Exo_2'] font-bold text-sm transition-all
          ${saved2 ? "bg-emerald-500 text-white" : "bg-cyan-500 text-[#030d1e] hover:bg-cyan-400 shadow-[0_0_24px_rgba(0,212,255,0.2)]"}`}>
        {saved2 ? <><CheckCircle size={15} /> Saved!</> : <><Send size={15} /> Save Notification Settings</>}
      </button>
    </div>
  );
}

function SettingsPage({ role, userName }: { role: Role; userName: string }) {
  const isAdmin = role === "admin";
  type TabId = "profile" | "notifications" | "general" | "iot" | "security";
  const allTabs: { id: TabId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "general", label: "General", icon: Settings, adminOnly: true },
    { id: "iot", label: "IoT / MQTT", icon: Wifi, adminOnly: true },
    { id: "security", label: "Security", icon: Shield, adminOnly: true },
  ];
  const tabs = allTabs.filter(t => !t.adminOnly || isAdmin);
  const [tab, setTab] = useState<TabId>(isAdmin ? "general" : "profile");

  return (
    <div className="p-6">
      <SectionHeader
        title={isAdmin ? "System Settings" : "Account Settings"}
        subtitle={isAdmin ? "Platform configuration, IoT brokers, security policies & notification channels" : `Manage your profile and notification preferences, ${userName.split(" ")[0]}`}
      />
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/[0.02] border border-white/[0.05] w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" : "text-slate-500 hover:text-slate-300"}`}>
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="max-w-2xl space-y-5">
          <GlassCard className="p-6">
            <div className="flex items-center gap-5 mb-6">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${ROLE_META[role].avatarBg} border border-white/[0.08] flex items-center justify-center text-2xl font-bold font-["Exo_2"] ${ROLE_META[role].color}`}>
                {userName.charAt(0)}
              </div>
              <div>
                <h3 className="font-['Exo_2'] font-bold text-white text-lg">{userName}</h3>
                <div className={`text-sm font-mono ${ROLE_META[role].color}`}>{ROLE_META[role].label} · {ROLE_META[role].tagline}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Display Name", val: userName },
                { label: "Role", val: ROLE_META[role].label },
                { label: "Platform", val: "TwinSphere — AOP Digital Twin" },
                { label: "Status", val: "Active" },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">{f.label}</label>
                  <input defaultValue={f.val} readOnly={f.label === "Role" || f.label === "Status"}
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-300 text-sm font-mono focus:outline-none focus:border-cyan-500/30 transition-colors" />
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard className="p-6">
            <h4 className="font-['Exo_2'] font-semibold text-white text-sm mb-4">Change Password</h4>
            <div className="space-y-3">
              {["Current Password", "New Password", "Confirm New Password"].map(f => (
                <div key={f}>
                  <label className="block text-[10px] font-mono text-slate-500 mb-1 uppercase tracking-wider">{f}</label>
                  <input type="password" placeholder="••••••••"
                    className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-300 text-sm font-mono focus:outline-none focus:border-cyan-500/30 transition-colors" />
                </div>
              ))}
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/20 transition-all mt-2">
                <Shield size={13} /> Update Password
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {tab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "Institution Name", val: "Adeseun Ogundoyin Polytechnic", desc: "Used in reports and notifications" },
            { label: "Platform Name", val: "TwinSphere", desc: "Displayed in the browser and emails" },
            { label: "Time Zone", val: "Africa/Lagos (WAT, UTC+1)", desc: "All timestamps use this zone" },
            { label: "Data Retention", val: "365 days", desc: "Sensor readings older than this are archived" },
          ].map((f) => (
            <GlassCard key={f.label} className="p-5">
              <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">{f.label}</label>
              <input defaultValue={f.val}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-300 text-sm font-mono focus:outline-none focus:border-cyan-500/30 transition-colors mb-1.5" />
              <p className="text-[10px] text-slate-600">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "iot" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: "MQTT Broker Host", val: "mqtt.aop-campus.edu.ng", desc: "Mosquitto broker endpoint" },
            { label: "MQTT Port", val: "8883 (TLS)", desc: "Port for encrypted MQTT" },
            { label: "WebSocket URL", val: "wss://ws.aop-campus.edu.ng", desc: "Real-time socket endpoint" },
            { label: "Sampling Rate", val: "1000ms", desc: "Default sensor polling interval" },
          ].map((f) => (
            <GlassCard key={f.label} className="p-5">
              <label className="block text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">{f.label}</label>
              <input defaultValue={f.val}
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-300 text-sm font-mono focus:outline-none focus:border-cyan-500/30 transition-colors mb-1.5" />
              <p className="text-[10px] text-slate-600">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "security" && (
        <div className="space-y-4">
          {[
            { label: "JWT Expiry", val: "15m", desc: "Access token TTL" },
            { label: "Refresh Token Expiry", val: "7 days", desc: "Rotate refresh tokens on use" },
            { label: "Max Login Attempts", val: "5", desc: "Before temporary account lock" },
            { label: "Session Timeout", val: "30 minutes idle", desc: "Auto-logout after inactivity" },
          ].map((f) => (
            <GlassCard key={f.label} className="p-4 flex items-center gap-4">
              <Key size={16} className="text-violet-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-mono text-slate-400 mb-0.5">{f.label}</div>
                <div className="text-sm font-['Exo_2'] font-semibold text-white">{f.val}</div>
                <div className="text-[10px] text-slate-600">{f.desc}</div>
              </div>
              <button className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors">Edit</button>
            </GlassCard>
          ))}
        </div>
      )}

      {tab === "notifications" && <NotificationsSettings />}
    </div>
  );
}

// ─── Notification Panel ───────────────────────────────────────────────────────

function NotifPanel({ notifs, onClose }: { notifs: Notif[]; onClose: () => void }) {
  const iconMap: Record<AlertType, { Icon: React.ElementType; color: string }> = {
    warning: { Icon: AlertTriangle, color: "text-amber-400" },
    success: { Icon: CheckCircle, color: "text-emerald-400" },
    error: { Icon: AlertCircle, color: "text-red-400" },
    info: { Icon: Bell, color: "text-cyan-400" },
  };
  return (
    <div className="absolute right-0 top-12 w-80 z-50 rounded-xl border border-cyan-500/15 bg-[#071428] shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <span className="font-['Exo_2'] font-semibold text-white text-sm">Notifications</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
      </div>
      <div className="divide-y divide-white/[0.03] max-h-80 overflow-y-auto">
        {notifs.map((n) => {
          const { Icon, color } = iconMap[n.type];
          return (
            <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${n.read ? "opacity-50" : ""} hover:bg-white/[0.02] transition-colors`}>
              <Icon size={14} className={`${color} mt-0.5 flex-shrink-0`} />
              <div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                <span className="text-[10px] font-mono text-slate-600">{n.time}</span>
              </div>
              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 mt-1" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page | "landing">("landing");
  const [isDark, setIsDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFS);
  const [extraUsers, setExtraUsers] = useState<UserRecord[]>(() => loadRegisteredUsers());

  const sensorData = useMemo(() => makeSensorData(48), []);
  const unreadCount = notifs.filter(n => !n.read).length;

  const [currentUserName, setCurrentUserName] = useState("User");
  const handleLogin = useCallback((r: Role, name: string) => {
    setRole(r);
    setCurrentUserName(name);
    setPage("dashboard");
  }, []);
  const logout = useCallback(() => { setPage("landing"); setRole("admin"); setCurrentUserName("User"); }, []);
  const navTo = useCallback((p: Page) => setPage(p), []);

  const handleRegister = useCallback((u: UserRecord) => {
    setExtraUsers(prev => {
      const updated = [...prev, u];
      return updated;
    });
  }, []);

  if (PUBLIC_PAGES.includes(page as Page)) {
    return (
      <div className={isDark ? "dark" : ""}>
        {page === "landing" && <LandingPage onLogin={handleLogin} onNavigate={navTo} />}
        {page === "features" && <FeaturesPage onNavigate={navTo} />}
        {page === "documentation" && <DocumentationPage onNavigate={navTo} />}
        {page === "research" && <ResearchPage onNavigate={navTo} />}
        {page === "register" && <RegisterPage onNavigate={navTo} onLogin={handleLogin} onRegister={handleRegister} />}
      </div>
    );
  }

  const pageComponents: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage sensorData={sensorData} role={role} extraUsers={extraUsers} onNav={(p) => setPage(p)} userName={currentUserName} />,
    twins: <TwinsPage role={role} onNav={(p) => setPage(p)} />,
    monitoring: <MonitoringPage sensorData={sensorData} role={role} />,
    simulations: <SimulationsPage role={role} onNav={(p) => setPage(p)} />,
    analytics: <AnalyticsPage sensorData={sensorData} role={role} />,
    reports: <ReportsPage role={role} />,
    devices: <DevicesPage role={role} />,
    users: <UsersPage extraUsers={extraUsers} onUpdateExtraUsers={(u) => { setExtraUsers(u); }} role={role} />,
    audit: <AuditPage />,
    tasks: <TasksPage role={role} onNav={(p) => setPage(p)} />,
    settings: <SettingsPage role={role} userName={currentUserName} />,
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-['Inter'] dark:bg-[#030d1e]"
        style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Mobile overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setMobileNavOpen(false)} />
        )}
        <Sidebar
          page={page as Page}
          onNav={(p) => { setPage(p); setNotifOpen(false); }}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
          role={role}
          onLogout={logout}
          extraUsers={extraUsers}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          userName={currentUserName}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="relative">
            <Topbar
              page={page as Page}
              notifCount={unreadCount}
              onNotifClick={() => setNotifOpen(!notifOpen)}
              role={role}
              isDark={isDark}
              onTheme={() => setIsDark(!isDark)}
              onMobileNav={() => setMobileNavOpen(v => !v)}
              userName={currentUserName}
            />
            {notifOpen && (
              <NotifPanel notifs={notifs} onClose={() => setNotifOpen(false)} />
            )}
          </div>
          <main className="flex-1 overflow-y-auto scrollbar-none">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {pageComponents[page] ?? <DashboardPage sensorData={sensorData} />}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}
