"use client";

import PaymentRequestList from "@/components/PaymentRequestList";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SuperAdminApprovalsPage() {
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
                    <span className="role-badge role-super">⚡ Super Admin</span>
                    <button className="btn-ghost" onClick={() => router.push("/superadmin/dashboard")}>Back to Dashboard</button>
                </div>
            </header>

            <main className="page-content" style={{ position: "relative", zIndex: 10 }}>
                <Link href="/superadmin/dashboard" style={{ display: "inline-block", marginBottom: "24px", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                    ← Back to Dashboard
                </Link>
                <div className="glass-card fade-up" style={{ padding: "24px", minHeight: "60vh" }}>
                    <PaymentRequestList role="SUPER_ADMIN" />
                </div>
            </main>
        </div>
    );
}
