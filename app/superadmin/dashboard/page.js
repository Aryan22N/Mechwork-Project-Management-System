"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import ShimmerLoader from "@/components/ShimmerLoader";
import DashboardCard from "@/components/DashboardCard";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // All-projects analytics (for chart)
    const [analytics, setAnalytics] = useState({ totalAllocated: 0, totalUtilized: 0, chartData: [] });

    // Per-project filtered analytics (for budget cards)
    const [filteredAnalytics, setFilteredAnalytics] = useState({ totalAllocated: 0, totalUtilized: 0 });
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("all");
    const [filterLoading, setFilterLoading] = useState(false);

    // Fetch all active projects for the filter dropdown
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/projects?status=ACTIVE");
                const data = await res.json();
                if (Array.isArray(data)) setProjects(data);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
            }
        };
        fetchProjects();
    }, []);

    // Fetch overall analytics for the chart
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch("/api/analytics/projects");
                const data = await res.json();
                if (data && !data.error) {
                    setAnalytics(data);
                    setFilteredAnalytics({ totalAllocated: data.totalAllocated, totalUtilized: data.totalUtilized });
                }
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setTimeout(() => setIsLoading(false), 400);
            }
        };
        fetchAnalytics();
    }, []);

    // Re-fetch budget cards when project filter changes
    const handleProjectFilter = useCallback(async (projectId) => {
        setSelectedProject(projectId);
        setFilterLoading(true);
        try {
            const url = projectId === "all"
                ? "/api/analytics/projects"
                : `/api/analytics/projects?projectId=${projectId}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && !data.error) {
                setFilteredAnalytics({ totalAllocated: data.totalAllocated, totalUtilized: data.totalUtilized });
            }
        } catch (err) {
            console.error("Failed to filter analytics:", err);
        } finally {
            setFilterLoading(false);
        }
    }, []);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    const selectedProjectName = selectedProject === "all"
        ? "All Active Projects"
        : projects.find(p => p.id === selectedProject)?.name || "Selected Project";

    return (
        <div style={{ minHeight: "100vh" }} className="responsive-root">
            <div className="bg-mesh-custom" />
            <div className="orb1" />
            <div className="orb2" />

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? "open" : ""}`}>
                <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>✕</button>
                <div style={{ marginBottom: "24px", textAlign: "center" }}>
                    <div className="role-badge role-super" style={{ marginBottom: "12px" }}>⚡ Super Admin</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Control Center</div>
                </div>

                <Link href="/superadmin/projects/progress" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>📈</span> Project Progress
                </Link>
                <Link href="/superadmin/dashboard/projects" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>🏗️</span> Manage Projects
                </Link>
                <Link href="/superadmin/dashboard/approvals" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>✔️</span> Pending Approvals
                </Link>
                <Link href="/superadmin/history" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>📜</span> Payment History
                </Link>
                <Link href="/superadmin/gallery" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>🖼️</span> Stored Images
                </Link>
                <Link href="/superadmin/members" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>👥</span> Manage Members
                </Link>
                <Link href="/superadmin/workers" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>👷</span> Worker Management
                </Link>

                <button className="mobile-menu-link" style={{ width: "100%", background: "rgba(248, 113, 113, 0.05)", borderColor: "rgba(248, 113, 113, 0.2)", color: "var(--danger)" }} onClick={handleLogout}>
                    <span>🚪</span> Sign Out
                </button>
            </div>

            {/* Header */}
            <header className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Image
                        src="/Logo_1.png"
                        alt="Solar Logo"
                        width={240}
                        height={36}
                        style={{ borderRadius: '8px' }}
                    />
                </div>

                <div className="nav-desktop">
                    <span className="role-badge role-super" style={{ height: "36px", display: "inline-flex", alignItems: "center" }}>⚡ Super Admin</span>
                    <button className="btn-ghost" style={{ height: "36px", display: "inline-flex", alignItems: "center" }} onClick={handleLogout}>Sign Out</button>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button className="hamburger-btn" onClick={() => setIsMenuOpen(true)}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="3" y="5" width="14" height="2" rx="1" fill="currentColor" />
                            <rect x="3" y="9" width="14" height="2" rx="1" fill="currentColor" />
                            <rect x="3" y="13" width="14" height="2" rx="1" fill="currentColor" />
                        </svg>
                    </button>
                </div>
            </header>

            <main className="page-content">
                {isLoading ? (
                    <ShimmerLoader />
                ) : (
                    <>
                        {/* ── Quick-action cards ── */}
                        <div className="fade-up" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "24px",
                            padding: "32px 0 0 0",
                            maxWidth: "1000px",
                            margin: "0 auto"
                        }}>
                            <DashboardCard
                                icon="✔️"
                                title="Pending Approvals"
                                description="Review and approve pending payment requests from managers."
                                href="/superadmin/dashboard/approvals"
                            />
                            <DashboardCard
                                icon="🏗️"
                                title="Manage Projects"
                                description="Create new projects or edit existing ones."
                                href="/superadmin/dashboard/projects"
                            />
                            <DashboardCard
                                icon="📈"
                                title="Project Progress"
                                description="Track and review project completion notes from managers."
                                href="/superadmin/projects/progress"
                            />
                            <DashboardCard
                                icon="📊"
                                title="Expense Analytics"
                                description="Deep dive into your project expenses by category."
                                href="/superadmin/analytics/expense-heads"
                            />
                            <DashboardCard
                                icon="📍"
                                title="Supervisor Attendance"
                                description="Track daily attendance and working hours of supervisors."
                                href="/superadmin/attendance"
                            />
                            <DashboardCard
                                icon="📜"
                                title="Payment History"
                                description="View a complete log of all past payments."
                                href="/superadmin/history"
                            />
                            <DashboardCard
                                icon="🖼️"
                                title="View Gallery"
                                description="Browse stored images and photos related to expenses."
                                href="/superadmin/gallery"
                            />
                            <DashboardCard
                                icon="👥"
                                title="Manage Members"
                                description="Add or remove team members and adjust their roles."
                                href="/superadmin/members"
                            />
                            <DashboardCard
                                icon="👷"
                                title="Worker Management"
                                description="Manage your workforce, tracking expenses per worker."
                                href="/superadmin/workers"
                            />


                        </div>

                        {/* ── Budget Summary Card (with project filter) ── */}
                        <div className="fade-up" style={{ maxWidth: "1000px", margin: "28px auto 0 auto" }}>
                            <div style={{
                                background: "rgba(255,255,255,0.96)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(226,232,240,0.7)",
                                borderRadius: "20px",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                                overflow: "hidden"
                            }}>
                                {/* Card header with filter */}
                                <div style={{
                                    padding: "18px 24px",
                                    borderBottom: "1px solid #f1f5f9",
                                    background: "rgba(248,250,252,0.7)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "12px"
                                }}>
                                    <div>
                                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                                            💹 Budget Overview
                                        </h3>
                                        <p style={{ fontSize: "12px", color: "#94a3b8", margin: "3px 0 0 0" }}>
                                            {selectedProjectName}
                                        </p>
                                    </div>

                                    {/* Project filter dropdown */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, whiteSpace: "nowrap" }}>
                                            Filter by:
                                        </span>
                                        <select
                                            value={selectedProject}
                                            onChange={(e) => handleProjectFilter(e.target.value)}
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 500,
                                                color: "#1e293b",
                                                background: "white",
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "10px",
                                                padding: "7px 32px 7px 12px",
                                                cursor: "pointer",
                                                outline: "none",
                                                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                                                appearance: "none",
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                                                backgroundRepeat: "no-repeat",
                                                backgroundPosition: "right 10px center",
                                                minWidth: "180px",
                                                maxWidth: "240px"
                                            }}
                                        >
                                            <option value="all">All Active Projects</option>
                                            {projects.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Budget stat tiles */}
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: "0",
                                }}>
                                    {/* Allocated */}
                                    <div style={{
                                        padding: "28px 28px",
                                        borderRight: "1px solid #f1f5f9",
                                        opacity: filterLoading ? 0.5 : 1,
                                        transition: "opacity 0.2s"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                            <div style={{
                                                width: "38px", height: "38px", borderRadius: "10px",
                                                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "20px"
                                            }}>💰</div>
                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                                Total Budget Allocated
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "30px", fontWeight: 800, color: "#1e40af", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                                            ₹{filteredAnalytics.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                                            {selectedProject === "all" ? "For all active projects" : `For ${selectedProjectName}`}
                                        </p>
                                    </div>

                                    {/* Utilized */}
                                    <div style={{
                                        padding: "28px 28px",
                                        opacity: filterLoading ? 0.5 : 1,
                                        transition: "opacity 0.2s"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                                            <div style={{
                                                width: "38px", height: "38px", borderRadius: "10px",
                                                background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "20px"
                                            }}>💸</div>
                                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                                                Total Budget Utilized
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "30px", fontWeight: 800, color: "#d97706", lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                                            ₹{filteredAnalytics.totalUtilized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px" }}>
                                            Sum of all paid expenses
                                        </p>
                                        {/* Over-budget warning */}
                                        {filteredAnalytics.totalUtilized > filteredAnalytics.totalAllocated && filteredAnalytics.totalAllocated > 0 && (
                                            <div style={{
                                                marginTop: "10px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                background: "rgba(239,68,68,0.08)",
                                                border: "1px solid rgba(239,68,68,0.2)",
                                                borderRadius: "8px",
                                                padding: "4px 10px",
                                                fontSize: "11px",
                                                color: "#dc2626",
                                                fontWeight: 600
                                            }}>
                                                ⚠️ Over budget by ₹{(filteredAnalytics.totalUtilized - filteredAnalytics.totalAllocated).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Chart Card ── */}
                        <div className="fade-up" style={{ maxWidth: "1000px", margin: "20px auto 40px auto" }}>
                            <div style={{
                                background: "rgba(255,255,255,0.96)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(226,232,240,0.7)",
                                borderRadius: "20px",
                                boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                                overflow: "hidden"
                            }}>
                                <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", background: "rgba(248,250,252,0.7)" }}>
                                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                                        📊 Budget vs Actual — Top Active Projects
                                    </h3>
                                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "3px 0 0 0" }}>
                                        Comparing allocated budget against amount spent
                                    </p>
                                </div>
                                <div style={{ padding: "24px 16px 16px 8px" }}>
                                    <div style={{ height: "400px", width: "100%", overflow: "hidden" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={analytics.chartData}
                                                margin={{ top: 20, right: 20, left: 10, bottom: 60 }}
                                                barSize={28}
                                                barGap={4}
                                            >
                                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#cbd5e1" opacity={0.6} />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={{ stroke: '#cbd5e1' }}
                                                    tickLine={false}
                                                    angle={-35}
                                                    textAnchor="end"
                                                    interval={0}
                                                    height={70}
                                                    tick={(props) => {
                                                        const { x, y, payload } = props;
                                                        const label = payload.value.length > 14 ? payload.value.slice(0, 12) + '…' : payload.value;
                                                        return (
                                                            <g transform={`translate(${x},${y})`}>
                                                                <text
                                                                    x={0} y={0} dy={10}
                                                                    textAnchor="end"
                                                                    fill="#475569"
                                                                    fontSize={11}
                                                                    fontWeight={500}
                                                                    transform="rotate(-35)"
                                                                >
                                                                    {label}
                                                                </text>
                                                            </g>
                                                        );
                                                    }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                                                    tickFormatter={(value) => `₹${value >= 100000 ? (value / 100000).toFixed(1) + 'L' : value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                                    width={55}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '13px' }}
                                                    formatter={(value) => [`₹${value.toLocaleString()}`, undefined]}
                                                />
                                                <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px' }} iconType="circle" />
                                                <Bar dataKey="budget" name="Allocated Budget" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="spent" name="Amount Spent" fill="var(--accent, #f59e0b)" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
