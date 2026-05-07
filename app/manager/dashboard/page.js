"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import PaymentRequestList from "@/components/PaymentRequestList";
import ProjectProgress from "@/components/ProjectProgress";
import ShimmerLoader from "@/components/ShimmerLoader";
import BillUploadForm from "@/components/BillUploadForm";
import RecentBillsList from "@/components/RecentBillsList";
import PaymentRequestForm from "@/components/PaymentRequestForm";

export default function ManagerDashboard() {
    const router = useRouter();
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showBillForm, setShowBillForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        fetch("/api/projects?status=ACTIVE")
            .then(res => res.json())
            .then(data => {
                setProjects(data);
                setSelectedProjectId("all");
            })
            .catch(err => console.error(err))
            .finally(() => {
                // Keep shimmer for a tiny bit longer for smooth transition
                setTimeout(() => setIsLoading(false), 600);
            });
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
                    <div className="role-badge role-manager" style={{ marginBottom: "12px" }}>📋 Project Manager</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Review & Approve</div>
                </div>

                <Link href="/manager/projects/progress" className="mobile-menu-link" onClick={() => setIsMenuOpen(false)}>
                    <span>📈</span> Project Progress
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
                    <Link href="/manager/projects/progress" className="btn-ghost" style={{ textDecoration: "none", height: "36px", display: "inline-flex", alignItems: "center" }}>📈 Project Progress</Link>
                    <span className="role-badge role-manager">📋 Project Manager</span>
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


                        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
                            <button
                                className="btn-primary fade-up"
                                style={{ width: "auto", padding: "10px 32px" }}
                                onClick={() => router.push("/manager/projects/progress")}
                            >
                                📈 Open Progress Tracker and Note
                            </button>
                            <button
                                className="btn-ghost fade-up"
                                style={{ width: "auto", padding: "10px 32px", border: "1px solid var(--border)", background: showBillForm ? "rgba(0,0,0,0.05)" : "white" }}
                                onClick={() => setShowBillForm(!showBillForm)}
                            >
                                🧾 {showBillForm ? "Close Bill Form" : "Add Bills"}
                            </button>
                            <button className="btn-ghost fade-up"
                                style={{ width: "auto", padding: "10px 32px", border: "1px solid var(--border)", background: showBillForm ? "rgba(0,0,0,0.05)" : "white" }}
                                onClick={() => { setIsMenuOpen(false); setShowExpenseForm(true); }}>
                                <span></span> Add Expense
                            </button>
                        </div>

                        {showBillForm && (
                            <BillUploadForm onSuccess={() => {
                                setShowBillForm(false);
                                setRefreshTrigger(prev => prev + 1);
                            }} />
                        )}

                        {showExpenseForm && (
                            <PaymentRequestForm onSuccess={() => {
                                setShowExpenseForm(false);
                                setRefreshTrigger(prev => prev + 1);
                            }} />
                        )}

                        <PaymentRequestList role="PROJECT_MANAGER" />

                    </>
                )}
            </main>
        </div>
    );
}
