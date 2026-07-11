"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import ShimmerLoader from "@/components/ShimmerLoader";
import DashboardCard from "@/components/DashboardCard";

export default function SupervisorDashboard() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        fetch("/api/verify")
            .then(res => res.json())
            .then(data => {
                if (data.name) setUserName(data.name);
            })
            .catch(err => console.error(err));
            
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    const navBtnStyle = {
        display: "none" // removed unused style
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
                    <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Field Operations</div>
                </div>

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
                            <p style={{ color: "var(--text-muted)", marginTop: "8px" }}>Here's an overview of your operations.</p>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="fade-up" style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "24px",
                            padding: "0 0 32px 0",
                            maxWidth: "1000px",
                            margin: "0 auto"
                        }}>

                            <DashboardCard
                                icon="💸"
                                title="Add Expense & Bill"
                                description="Submit new expenses and upload bills for projects."
                                href="/supervisor/dashboard/add-expense"
                            />
                            <DashboardCard
                                icon="📊"
                                title="Project Progress"
                                description="Update completion status and notes for your projects."
                                href="/supervisor/dashboard/progress"
                            />
                            <DashboardCard
                                icon="📋"
                                title="Recent Requests"
                                description="View the status of your recent payment requests."
                                href="/supervisor/dashboard/requests"
                            />
                        </div>

                    </>
                )}
            </main>
        </div>
    );
}
