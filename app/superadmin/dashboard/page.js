"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import ShimmerLoader from "@/components/ShimmerLoader";
import DashboardCard from "@/components/DashboardCard";

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
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
                    <div className="fade-up" style={{ 
                        display: "grid", 
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                        gap: "24px", 
                        padding: "32px 0",
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
                    </div>
                )}
            </main>
        </div>
    );
}
