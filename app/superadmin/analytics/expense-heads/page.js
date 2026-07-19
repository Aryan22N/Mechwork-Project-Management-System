"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ShimmerLoader from "@/components/ShimmerLoader";
import { Pie, PieChart, Cell, Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export default function AnalyticsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [selectedHead, setSelectedHead] = useState("");
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch("/api/projects?status=ACTIVE");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setProjects(data);
                    if (data.length > 0) {
                        setSelectedProject(data[0].id.toString());
                    }
                }
            } catch (err) {
                console.error("Failed to fetch projects:", err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!selectedProject) return;

        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                let url = `/api/analytics/expense-heads?projectId=${selectedProject}`;
                if (selectedHead) {
                    url += `&head=${encodeURIComponent(selectedHead)}`;
                }
                const res = await fetch(url);
                const data = await res.json();
                if (!data.error) {
                    setAnalytics(data);
                    
                    if (data.breakdown) {
                        const headsInUse = Object.keys(data.breakdown);
                        const project = projects.find(p => p.id === parseInt(selectedProject));
                        const predefinedHeads = project?.expense_heads || [];
                        const allHeads = Array.from(new Set([...headsInUse, ...predefinedHeads]));
                        setExpenseHeads(allHeads);

                        if (!selectedHead && allHeads.length > 0) {
                            setSelectedHead(allHeads[0]);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch expense analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [selectedProject, selectedHead, projects]);

    const formatCurrency = (amount) => {
        return `₹${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    // Prepare chart data
    const pieData = analytics ? [
        { name: selectedHead || 'Selected', value: analytics.selectedHeadAmount },
        { name: 'Other Categories', value: analytics.otherCategoriesAmount }
    ] : [];
    const pieColors = ['#3b82f6', '#e2e8f0'];

    const barData = analytics && analytics.breakdown ? 
        Object.keys(analytics.breakdown).map(key => ({
            name: key,
            amount: analytics.breakdown[key]
        })).sort((a, b) => b.amount - a.amount) : [];

    const chartConfig = {
        amount: {
            label: "Amount",
            color: "#3b82f6"
        },
        selected: {
            label: selectedHead || "Selected",
            color: "#3b82f6"
        },
        other: {
            label: "Other Categories",
            color: "#e2e8f0"
        }
    };

    return (
        <div style={{ minHeight: "100vh" }} className="responsive-root">
            <div className="bg-mesh-custom" />
            
            {/* Header */}
            <header className="page-header" style={{ position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Image src="/Logo_1.png" alt="Solar Logo" width={240} height={36} style={{ borderRadius: '8px' }} />
                </div>
                <div className="nav-desktop">
                    <button className="btn-ghost" onClick={() => router.back()}>Back</button>
                </div>
            </header>

            <main className="page-content" style={{ position: "relative", zIndex: 10 }}>
                <Link href="#" onClick={(e) => { e.preventDefault(); router.back(); }} style={{ display: "inline-block", marginBottom: "24px", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                    ← Back to Dashboard
                </Link>

                {pageLoading ? (
                    <ShimmerLoader />
                ) : (
                    <div className="fade-up">
                        <h2 className="section-title">Expense Category Analytics</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>Deep dive into your project expenses by category.</p>

                        <div style={{
                            background: "rgba(255,255,255,0.96)",
                            backdropFilter: "blur(20px)",
                            border: "1px solid rgba(226,232,240,0.7)",
                            borderRadius: "20px",
                            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
                            overflow: "hidden",
                            marginBottom: "32px"
                        }}>
                            <div style={{
                                padding: "18px 24px",
                                borderBottom: "1px solid #f1f5f9",
                                background: "rgba(248,250,252,0.7)",
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flexWrap: "wrap"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Project:</span>
                                    <select
                                        value={selectedProject}
                                        onChange={(e) => {
                                            setSelectedProject(e.target.value);
                                            setSelectedHead(""); 
                                        }}
                                        className="input-field"
                                        style={{ padding: "8px 12px", minWidth: "180px", background: "#fff", cursor: "pointer", height: "auto" }}
                                    >
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Category:</span>
                                    <select
                                        value={selectedHead}
                                        onChange={(e) => setSelectedHead(e.target.value)}
                                        className="input-field"
                                        style={{ padding: "8px 12px", minWidth: "160px", background: "#fff", cursor: "pointer", height: "auto" }}
                                    >
                                        {expenseHeads.length === 0 && <option value="">No categories</option>}
                                        {expenseHeads.map(head => (
                                            <option key={head} value={head}>{head}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ padding: "24px", opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
                                {!analytics ? (
                                    <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>Select a project to load data</div>
                                ) : (
                                    <>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px" }}>
                                            <div style={{ background: "linear-gradient(135deg, rgba(239, 246, 255, 0.5) 0%, rgba(219, 234, 254, 0.5) 100%)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(191, 219, 254, 0.5)" }}>
                                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6", textTransform: "uppercase", marginBottom: "8px" }}>
                                                    Spent on {selectedHead || "Selected Category"}
                                                </div>
                                                <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e3a8a", lineHeight: 1.2 }}>
                                                    {formatCurrency(analytics.selectedHeadAmount)}
                                                </div>
                                            </div>

                                            <div style={{ background: "linear-gradient(135deg, rgba(243, 244, 246, 0.5) 0%, rgba(229, 231, 235, 0.5) 100%)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(229, 231, 235, 0.8)" }}>
                                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", marginBottom: "8px" }}>
                                                    Spent on Other Categories
                                                </div>
                                                <div style={{ fontSize: "28px", fontWeight: 800, color: "#374151", lineHeight: 1.2 }}>
                                                    {formatCurrency(analytics.otherCategoriesAmount)}
                                                </div>
                                            </div>

                                            <div style={{ background: "linear-gradient(135deg, rgba(254, 243, 199, 0.3) 0%, rgba(253, 230, 138, 0.3) 100%)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(253, 230, 138, 0.5)" }}>
                                                <div style={{ fontSize: "12px", fontWeight: 700, color: "#d97706", textTransform: "uppercase", marginBottom: "8px" }}>
                                                    Total Project Expenses
                                                </div>
                                                <div style={{ fontSize: "28px", fontWeight: 800, color: "#92400e", lineHeight: 1.2 }}>
                                                    {formatCurrency(analytics.totalSpent)}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                                            {/* Donut Chart */}
                                            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                                <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#1e293b", fontWeight: 600, width: "100%", textAlign: "left" }}>Proportion of Expenses</h4>
                                                <div style={{ width: "100%", height: "250px" }}>
                                                    <ChartContainer config={chartConfig} style={{ width: '100%', height: '100%' }}>
                                                        <PieChart>
                                                            <Pie
                                                                data={pieData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={70}
                                                                outerRadius={90}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                                stroke="none"
                                                            >
                                                                {pieData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                                                                ))}
                                                            </Pie>
                                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                        </PieChart>
                                                    </ChartContainer>
                                                </div>
                                                <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap", justifyContent: "center" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                                                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3b82f6" }}></span>
                                                        {selectedHead || "Selected"}
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#475569" }}>
                                                        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e2e8f0" }}></span>
                                                        Other
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bar Chart */}
                                            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "24px" }}>
                                                <h4 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#1e293b", fontWeight: 600 }}>All Categories Overview</h4>
                                                <div style={{ width: "100%", height: "280px" }}>
                                                    <ChartContainer config={chartConfig} style={{ width: '100%', height: '100%' }}>
                                                        <BarChart accessibilityLayer data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                            <XAxis 
                                                                dataKey="name" 
                                                                axisLine={false} 
                                                                tickLine={false} 
                                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                                tickMargin={10}
                                                                tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                                                            />
                                                            <YAxis 
                                                                axisLine={false} 
                                                                tickLine={false} 
                                                                tick={{ fill: '#64748b', fontSize: 11 }}
                                                                tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`}
                                                                width={50}
                                                            />
                                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                            <Bar dataKey="amount" fill="var(--color-amount)" radius={4} maxBarSize={50} />
                                                        </BarChart>
                                                    </ChartContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
