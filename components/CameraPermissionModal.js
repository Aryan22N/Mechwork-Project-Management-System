"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CameraPermissionModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            // Check if we've already shown the prompt to this user
            const hasShownPrompt = localStorage.getItem("permissionsPromptShown");
            
            if (hasShownPrompt === "true") {
                return;
            }

            try {
                // If browser supports permissions API, check if both are already granted
                if (navigator.permissions && navigator.permissions.query) {
                    const [cameraPerm, locationPerm] = await Promise.allSettled([
                        navigator.permissions.query({ name: "camera" }),
                        navigator.permissions.query({ name: "geolocation" }),
                    ]);
                    const cameraGranted = cameraPerm.status === "fulfilled" && cameraPerm.value.state === "granted";
                    const locationGranted = locationPerm.status === "fulfilled" && locationPerm.value.state === "granted";
                    if (cameraGranted && locationGranted) {
                        localStorage.setItem("permissionsPromptShown", "true");
                        return; // Both already granted, no need to show modal
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
                // Request both permissions via native bridge
                window.location.href = "median://permissions/request?permission=camera";
                // Small delay before requesting location so native dialogs don't overlap
                setTimeout(() => {
                    window.location.href = "median://permissions/request?permission=location";
                }, 500);
            } else {
                // Request camera permission
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        stream.getTracks().forEach(track => track.stop());
                    } catch (camErr) {
                        console.warn("Camera permission error:", camErr);
                    }
                }

                // Request location permission
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        () => {}, // Success — permission granted
                        (err) => console.warn("Location permission error:", err),
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                    );
                }
            }
        } catch (err) {
            console.warn("Permission request error:", err);
        } finally {
            localStorage.setItem("permissionsPromptShown", "true");
            setIsOpen(false);
        }
    };

    const handleSkip = () => {
        localStorage.setItem("permissionsPromptShown", "true");
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            margin: "0 auto 20px",
                        }}>
                            <div style={{
                                width: "56px",
                                height: "56px",
                                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px"
                            }}>
                                📸
                            </div>
                            <div style={{
                                width: "56px",
                                height: "56px",
                                background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "24px"
                            }}>
                                📍
                            </div>
                        </div>
                        
                        <h2 style={{
                            fontSize: "20px",
                            fontWeight: 800,
                            color: "#0f172a",
                            margin: "0 0 12px 0",
                            letterSpacing: "-0.02em"
                        }}>
                            Permissions Required
                        </h2>
                        
                        <p style={{
                            fontSize: "14px",
                            color: "#64748b",
                            lineHeight: 1.6,
                            margin: "0 0 20px 0"
                        }}>
                            We need access to the following to provide the best experience:
                        </p>

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            marginBottom: "24px",
                            textAlign: "left",
                        }}>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 14px",
                                background: "#f8fafc",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                            }}>
                                <span style={{ fontSize: "18px" }}>📸</span>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>Camera</div>
                                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>Capture bills, receipts & photos</div>
                                </div>
                            </div>
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 14px",
                                background: "#f8fafc",
                                borderRadius: "10px",
                                border: "1px solid #e2e8f0",
                            }}>
                                <span style={{ fontSize: "18px" }}>📍</span>
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>Location</div>
                                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>Attendance check-in verification</div>
                                </div>
                            </div>
                        </div>
                        
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
                                Allow Access
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
