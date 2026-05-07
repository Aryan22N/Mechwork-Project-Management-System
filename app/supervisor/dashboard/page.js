"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import PaymentRequestForm from "@/components/PaymentRequestForm";
import RecentBillsList from "@/components/RecentBillsList";
import ShimmerLoader from "@/components/ShimmerLoader";

export default function SupervisorDashboard() {
    const router = useRouter();
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
        await fetch("/api/logout", { method: "POST" });
        router.push("/login");
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setIsLoading(true);
        setTimeout(() => setIsLoading(false), 500);
    };

    const navBtnStyle = {
        padding: "14px 28px",
        fontSize: "15px",
        fontWeight: 600,
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        transition: "all 0.25s ease",
        background: "rgba(255,255,255,0.6)",
        color: "var(--text-muted)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        backdropFilter: "blur(8px)",
        flex: "1 1 0",
        maxWidth: "280px",
        textAlign: "center",
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
                    <div className="role-badge role-supervisor" style={{ marginBottom: "12px" }}>🛠️ Supervisor</div>
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
                    <span className="role-badge role-supervisor">🛠️ Supervisor</span>
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



                        {/* Navigation Buttons */}
                        <div className="fade-up" style={{ display: "flex", gap: "12px", marginTop: "32px", marginBottom: "32px", flexWrap: "wrap" }}>
                            <button
                                style={navBtnStyle}
                                onClick={() => router.push("/supervisor/dashboard/requests")}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(135deg, var(--primary), var(--primary-dark, #1a56db))";
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.25)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                                }}
                            >
                                📋 Recent Requests
                            </button>
                            <button
                                style={navBtnStyle}
                                onClick={() => router.push("/supervisor/dashboard/progress")}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(135deg, var(--primary), var(--primary-dark, #1a56db))";
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.25)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                                }}
                            >
                                📊 Project Progress & Notes
                            </button>
                            <button
                                style={navBtnStyle}
                                onClick={() => router.push("/supervisor/dashboard/add-bill")}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "linear-gradient(135deg, var(--primary), var(--primary-dark, #1a56db))";
                                    e.currentTarget.style.color = "#fff";
                                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,130,246,0.25)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.6)";
                                    e.currentTarget.style.color = "var(--text-muted)";
                                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                                }}
                            >
                                🧾 Add Bills
                            </button>
                        </div>


                        <RecentBillsList refreshTrigger={refreshTrigger} />

                        <PaymentRequestForm onSuccess={handleSuccess} />

                    </>
                )}
            </main>
        </div>
    );
}
