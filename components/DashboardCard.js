"use client";

import { useRouter } from "next/navigation";

export default function DashboardCard({ icon, title, description, href }) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(href)}
            style={{
                background: "rgba(255, 255, 255, 0.7)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                borderRadius: "20px",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                height: "100%",
                position: "relative",
                overflow: "hidden"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow = "0 20px 25px -5px rgba(59, 130, 246, 0.15), 0 10px 10px -5px rgba(59, 130, 246, 0.05)";
                e.currentTarget.style.borderColor = "var(--primary)";
                e.currentTarget.style.background = "#fff";
                
                const iconBg = e.currentTarget.querySelector('.icon-bg');
                if (iconBg) {
                    iconBg.style.background = "var(--primary)";
                    iconBg.style.color = "#fff";
                    iconBg.style.transform = "scale(1.1)";
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.6)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)";

                const iconBg = e.currentTarget.querySelector('.icon-bg');
                if (iconBg) {
                    iconBg.style.background = "rgba(59, 130, 246, 0.1)";
                    iconBg.style.color = "initial";
                    iconBg.style.transform = "scale(1)";
                }
            }}
        >
            <div 
                className="icon-bg"
                style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "rgba(59, 130, 246, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    transition: "all 0.3s ease"
                }}
            >
                {icon}
            </div>
            <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{title}</h3>
                <p style={{ margin: 0, fontSize: "14px", color: "#64748b", lineHeight: 1.5 }}>{description}</p>
            </div>
        </div>
    );
}
