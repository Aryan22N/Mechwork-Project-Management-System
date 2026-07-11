"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ShimmerLoader from "@/components/ShimmerLoader";
import DashboardCard from "@/components/DashboardCard";

export default function ManagerDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const [budgetWarnings, setBudgetWarnings] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch("/api/verify");
                const data = await res.json();
                if (data.name) setUserName(data.name);
            } catch (err) {
                console.error(err);
            }
        };

        const fetchAnalytics = async () => {
            try {
                const res = await fetch("/api/analytics/projects");
                const data = await res.json();
                if (data && data.chartData) {
                    const warnings = data.chartData.filter(p => p.budget > 0 && (p.spent / p.budget) >= 0.9);
                    setBudgetWarnings(warnings);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchUserData();
        fetchAnalytics();
            
        setIsLoading(true);
        // Quick shimmer for transition
        setTimeout(() => setIsLoading(false), 500);
    }, []);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <div style={{ minHeight: "100vh" }} className="responsive-root">
            <div className="bg-mesh-custom" />
            <div className="orb1" />
            <div className="orb2" />

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu-overlay ${isMenuOpen ? "open" : ""}`}>
                <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)}>✕</button>
                <div style={{ marginBottom: "24px", textAlign: "center" }}>
                    <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Dashboard Menu</div>
                </div>

                <Link href="/manager/projects/progress" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>📈</span> Project Progress
                </Link>
                <Link href="/manager/dashboard/approvals" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>✔️</span> Pending Approvals
                </Link>
                <Link href="/manager/workers" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
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
                    <button className="btn-ghost" onClick={handleLogout}>Sign Out</button>
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
                        {/* Welcome Banner */}
                        <div className="fade-up" style={{ textAlign: "center", marginBottom: "32px", padding: "0 16px" }}>
                            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "var(--text)" }}>Welcome, {userName || "User"} 👋</h1>
                            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>Here's an overview of your dashboard.</p>
                        </div>

                        {/* Budget Warnings */}
                        {budgetWarnings.length > 0 && (
                            <div className="fade-up" style={{ maxWidth: "1000px", margin: "0 auto 24px auto", padding: "0 16px" }}>
                                {budgetWarnings.map((warning, i) => (
                                    <div key={i} style={{ padding: "16px", marginBottom: "12px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <span style={{ fontSize: "20px" }}>⚠️</span>
                                        <div>
                                            <h4 style={{ margin: "0 0 4px 0", color: "#b91c1c", fontWeight: "600", fontSize: "15px" }}>Budget Alert: {warning.name}</h4>
                                            <p style={{ margin: 0, color: "#991b1b", fontSize: "14px" }}>
                                                This project has utilized ₹{warning.spent.toLocaleString()} out of its ₹{warning.budget.toLocaleString()} budget 
                                                ({((warning.spent / warning.budget) * 100).toFixed(1)}%). Please monitor pending approvals carefully.
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="fade-up" style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                            gap: "24px", 
                            padding: "0 0 32px 0",
                            maxWidth: "1000px",
                            margin: "0 auto"
                        }}>
                        <DashboardCard 
                            icon="✔️"
                            title="Pending Approvals"
                            description="Review and approve pending payment requests from supervisors."
                            href="/manager/dashboard/approvals"
                        />
                        <DashboardCard 
                            icon="📈"
                            title="Project Progress"
                            description="Track and update the completion percentage of your active projects."
                            href="/manager/projects/progress"
                        />
                        <DashboardCard 
                            icon="💸"
                            title="Add Expense & Bill"
                            description="Submit new expense requests and upload project bills."
                            href="/manager/dashboard/add-expense"
                        />
                        <DashboardCard 
                            icon="👷"
                            title="Worker Management"
                            description="Manage your workforce, tracking expenses per worker."
                            href="/manager/workers"
                        />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
