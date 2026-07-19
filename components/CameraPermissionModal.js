"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraPermissionModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            // Check if we've already shown the prompt to this user
            const hasShownPrompt = localStorage.getItem("cameraPromptShown");
            
            if (hasShownPrompt === "true") {
                return;
            }

            try {
                // If browser supports permissions API, check if it's already granted
                if (navigator.permissions && navigator.permissions.query) {
                    const perm = await navigator.permissions.query({ name: "camera" });
                    if (perm.state === "granted") {
                        localStorage.setItem("cameraPromptShown", "true");
                        return; // Already granted, no need to show modal
                    }
                }
            } catch (e) {
                // Ignore if API is unsupported and fall back to showing the modal based on localStorage
            }

            // Small delay so it pops up smoothly after dashboard loads
            setTimeout(() => {
                setIsOpen(true);
            }, 1000);
        };

        checkPermission();
    }, []);

    const handleAllow = async () => {
        try {
            if (typeof window !== "undefined" && window.median) {
                window.location.href = "median://permissions/request?permission=camera";
            } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
            }
        } catch (err) {
            console.warn("Camera permission error:", err);
        } finally {
            localStorage.setItem("cameraPromptShown", "true");
            setIsOpen(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem("cameraPromptShown", "true");
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px"
                }}>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(15, 23, 42, 0.4)",
                            backdropFilter: "blur(4px)"
                        }}
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            position: "relative",
                            background: "#fff",
                            borderRadius: "24px",
                            padding: "32px",
                            width: "100%",
                            maxWidth: "400px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                            textAlign: "center"
                        }}
                    >
                        <div style={{
                            width: "64px",
                            height: "64px",
                            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                            fontSize: "28px"
                        }}>
                            📸
                        </div>
                        
                        <h2 style={{
                            fontSize: "20px",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: "0 0 12px 0",
                            letterSpacing: "-0.02em"
                        }}>
                            Camera Access Required
                        </h2>
                        
                        <p style={{
                            fontSize: "14px",
                            color: "#64748b",
                            lineHeight: 1.6,
                            margin: "0 0 28px 0"
                        }}>
                            We need camera access to let you easily capture and upload bills, receipts, and material photos directly from your device.
                        </p>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <button 
                                onClick={handleAllow}
                                style={{
                                    background: "var(--primary)",
                                    color: "#fff",
                                    border: "none",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: "0 4px 12px rgba(var(--primary), 0.2)",
                                    transition: "transform 0.1s"
                                }}
                                onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
                                onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                            >
                                Allow Camera Access
                            </button>
                            
                            <button 
                                onClick={handleSkip}
                                style={{
                                    background: "transparent",
                                    color: "#94a3b8",
                                    border: "none",
                                    padding: "14px",
                                    borderRadius: "12px",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer"
                                }}
                            >
                                Maybe Later
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
