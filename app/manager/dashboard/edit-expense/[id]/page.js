"use client";

import { useEffect, useState, use } from "react";
import UnifiedExpenseBillForm from "@/components/UnifiedExpenseBillForm";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ShimmerLoader from "@/components/ShimmerLoader";

export default function ManagerEditExpensePage({ params }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const { id } = unwrappedParams;
    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/payment-requests/${id}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to load expense request");
                }
                const data = await res.json();
                setInitialData(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

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
                
                {loading ? (
                    <ShimmerLoader />
                ) : error ? (
                    <div className="glass-card fade-up" style={{ padding: "32px", textAlign: "center", color: "var(--danger)" }}>
                        <h3>Error</h3>
                        <p>{error}</p>
                        <button className="btn-primary" onClick={() => router.push("/manager/dashboard")} style={{ marginTop: "16px", padding: "8px 16px", width: "auto" }}>Go Back</button>
                    </div>
                ) : (
                    <UnifiedExpenseBillForm onSuccess={() => router.push("/manager/dashboard")} initialData={initialData} />
                )}
            </main>
        </div>
    );
}
