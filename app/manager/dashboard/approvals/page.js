"use client";

import PaymentRequestList from "@/components/PaymentRequestList";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ManagerApprovalsPage() {
    const router = useRouter();
    return (
        <div style={{ minHeight: "100vh", position: "relative", zIndex: 1 }} className="responsive-root">
            <div className="bg-mesh-custom" />
            <div className="orb1" />
            <div className="orb2" />

            <header className="page-header" style={{ position: "relative", zIndex: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Image src="/Logo_1.png" alt="Solar Logo" width={240} height={36} style={{ borderRadius: '8px' }} />
                </div>
                <div className="nav-desktop">
                    <span className="role-badge role-manager">📋 Project Manager</span>
                    <button className="btn-ghost" onClick={() => router.push("/manager/dashboard")}>Back to Dashboard</button>
                </div>
            </header>

            <main className="page-content" style={{ position: "relative", zIndex: 10 }}>
                <Link href="/manager/dashboard" style={{ display: "inline-block", marginBottom: "24px", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                    ← Back to Dashboard
                </Link>
                <div className="glass-card" style={{ padding: "24px", minHeight: "60vh" }}>
                    <PaymentRequestList role="PROJECT_MANAGER" />
                </div>
            </main>
        </div>
    );
}
