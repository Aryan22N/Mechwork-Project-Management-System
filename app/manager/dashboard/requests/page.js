"use client";

import PaymentRequestList from "@/components/PaymentRequestList";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ManagerRequestsPage() {
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
                    <button className="btn-ghost" onClick={() => router.push("/manager/dashboard")}>Back to Dashboard</button>
                </div>
            </header>

            <main className="page-content" style={{ position: "relative", zIndex: 10 }}>
                <Link href="/manager/dashboard" style={{ display: "inline-block", marginBottom: "24px", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                    ← Back to Dashboard
                </Link>
                
                <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px", color: "var(--text)" }}>My Expense Requests</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>View and manage the expense requests you have raised.</p>

                <PaymentRequestList role="MANAGER_OWN_REQUESTS" />
            </main>
        </div>
    );
}
