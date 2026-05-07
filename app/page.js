"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/verify")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          if (data.role === "SUPER_ADMIN") router.replace("/superadmin/dashboard");
          else if (data.role === "PROJECT_MANAGER") router.replace("/manager/dashboard");
          else if (data.role === "SUPERVISOR") router.replace("/supervisor/dashboard");
          else router.replace("/login");
        } else {
          router.replace("/login");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f8fafc" }}>
      <div style={{ textAlign: "center" }}>
        <Image
          src="/Logo_1.png"
          alt="Loading..."
          width={240}
          height={72}
          priority
          style={{ 
            borderRadius: '8px',
            animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" 
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  );
}
