"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [dob, setDob] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        fetch("/api/verify")
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    if (data.role === "SUPER_ADMIN") router.replace("/superadmin/dashboard");
                    else if (data.role === "PROJECT_MANAGER") router.replace("/manager/dashboard");
                    else if (data.role === "SUPERVISOR") router.replace("/supervisor/dashboard");
                } else {
                    setCheckingAuth(false);
                }
            })
            .catch(() => {
                setCheckingAuth(false);
            });
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    dob: dob.split("-").reverse().join("")
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "An error occurred. Please try again.");
                setLoading(false);
                return;
            }

            if (data.role === "SUPER_ADMIN") router.push("/superadmin/dashboard");
            else if (data.role === "PROJECT_MANAGER") router.push("/manager/dashboard");
            else if (data.role === "SUPERVISOR") router.push("/supervisor/dashboard");
            else {
                setError("Unknown role — contact your administrator.");
                setLoading(false);
            }
        } catch {
            setError("Network error. Please check your connection.");
            setLoading(false);
        }
    };

    const leftPanel = {
        hidden: { opacity: 0, x: -60 },
        show: {
            opacity: 1, x: 0,
            transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        },
    };

    const rightPanel = {
        hidden: { opacity: 0, x: 60 },
        show: {
            opacity: 1, x: 0,
            transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        },
    };

    const stagger = {
        show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
    };

    const fadeUp = {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
    };

    const pillVariant = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: "easeOut" } },
    };

    return (
        <div style={styles.root} className="responsive-root">
            {checkingAuth && (
                <div style={styles.checkingOverlay}>
                    <div style={styles.spinner}></div>
                </div>
            )}
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse-orb {
                    0%, 100% { transform: scale(1); opacity: 0.7; }
                    50% { transform: scale(1.15); opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .input-wrap:focus-within {
                    box-shadow: 0 0 0 3px var(--ring) !important;
                    border-color: var(--primary) !important;
                }
                .sign-in-btn:not(:disabled):hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 28px rgba(var(--primary), 0.45) !important;
                }
                .sign-in-btn:not(:disabled):active {
                    transform: translateY(0);
                }

                /* Mobile Responsiveness */
                @media (max-width: 992px) {
                    .responsive-root {
                        flex-direction: column !important;
                        overflow-y: auto !important;
                        overflow-x: hidden !important;
                    }
                    .responsive-left {
                        flex: none !important;
                    }
                    .responsive-left-inner {
                        padding: 40px 24px !important;
                        height: auto !important;
                    }
                    .responsive-hero-block {
                        padding-top: 40px !important;
                        margin-top: 20px !important;
                    }
                    .responsive-hero-title {
                        font-size: 32px !important;
                    }
                    .responsive-hero-title br {
                        display: none;
                    }
                    .responsive-pill-row {
                        flex-direction: row !important;
                        flex-wrap: wrap !important;
                        margin-top: 30px !important;
                    }
                    .responsive-sec-badge {
                        padding-top: 40px !important;
                        margin-top: 20px !important;
                    }
                    .responsive-right {
                        flex: none !important;
                        padding: 40px 24px 60px 24px !important;
                        align-items: flex-start !important;
                    }
                    .responsive-form-card {
                        max-width: 100% !important;
                        margin: 0 auto !important;
                    }
                }

                @media (max-width: 480px) {
                    .responsive-hero-title {
                        font-size: 28px !important;
                        line-height: 1.3 !important;
                    }
                    .responsive-left-inner {
                        padding: 30px 20px !important;
                    }
                    .responsive-right {
                        padding: 30px 20px 60px 20px !important;
                    }
                    .responsive-form-title {
                        font-size: 24px !important;
                    }
                }
            `}</style>




            <motion.div
                style={styles.right}
                className="responsive-right"
                variants={rightPanel}
                initial="hidden"
                animate="show"
            >
                {/* Logo */}
                <motion.div variants={fadeUp} style={{ marginBottom: "32px" }}>
                    <Image
                        src="/Logo_1.png"
                        alt="Solar Logo"
                        width={240}
                        height={220}
                        style={{ borderRadius: '8px', objectFit: 'contain' }}
                        priority
                    />
                </motion.div>
                <motion.div
                    style={styles.formCard}
                    className="responsive-form-card"
                    variants={stagger}
                    initial="hidden"
                    animate="show"
                >
                    {/* Header */}
                    <motion.div style={styles.formHeader} variants={fadeUp}>
                        <p style={styles.formEyebrow}>WELCOME BACK</p>
                        <h1 style={styles.formTitle} className="responsive-form-title">Sign in to your account</h1>
                        <p style={styles.formSub}>
                            Use your registered phone number and date of birth.
                        </p>
                    </motion.div>

                    <form onSubmit={handleLogin} style={styles.form}>

                        {/* Phone */}
                        <motion.div style={styles.field} variants={fadeUp}>
                            <label style={styles.label}>Phone Number</label>
                            <div className="input-wrap" style={styles.inputWrap}>
                                <span style={styles.inputIcon}>📱</span>
                                <input
                                    id="phone"
                                    type="tel"
                                    placeholder="Enter your 10-digit number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    required
                                    autoComplete="tel"
                                    style={styles.input}
                                />
                            </div>
                        </motion.div>

                        {/* DOB */}
                        <motion.div style={styles.field} variants={fadeUp}>
                            <label style={styles.label}>Date of Birth</label>
                            <div className="input-wrap" style={styles.inputWrap}>
                                <span style={styles.inputIcon}>📅</span>
                                <input
                                    id="dob"
                                    type="date"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    required
                                    style={{
                                        ...styles.input,
                                        colorScheme: "light",
                                    }}
                                />
                            </div>
                            <p style={styles.hint}>Your date of birth serves as your password.</p>
                        </motion.div>

                        {/* Error */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    style={styles.errorBox}
                                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <span>⚠️</span>
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit */}
                        <motion.div variants={fadeUp}>
                            <motion.button
                                type="submit"
                                disabled={loading}
                                suppressHydrationWarning
                                className="sign-in-btn"
                                style={{
                                    ...styles.btn,
                                    opacity: loading ? 0.7 : 1,
                                    cursor: loading ? "not-allowed" : "pointer",
                                }}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                            >
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={styles.spinner} />
                                        Signing in…
                                    </span>
                                ) : (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        Sign In
                                        <motion.svg
                                            width="16" height="16" viewBox="0 0 16 16" fill="none"
                                            animate={{ x: [0, 4, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </motion.svg>
                                    </span>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>



                </motion.div>
            </motion.div>
        </div>
    );
}

/* ── Styles ──────────────────────────────────────────────────── */
const styles = {
    root: {
        display: "flex",
        minHeight: "100vh",
        fontFamily: "var(--font-inter, 'Inter', sans-serif)",
        overflow: "hidden",
    },
    checkingOverlay: {
        position: "absolute",
        inset: 0,
        backgroundColor: "#f8fafc",
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    left: {
        display: "flex",
        flexDirection: "column",
        flex: "0 0 45%",
        background: "linear-gradient(160deg, #ecf2ff 0%, #f3f8ff 60%, #eef5ff 100%)",
        position: "relative",
        overflow: "hidden",
        borderRight: "1px solid rgba(15, 23, 42, 0.05)",
    },
    orb1: {
        position: "absolute",
        top: "-80px",
        left: "-80px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
        pointerEvents: "none",
        opacity: 0.15,
    },
    orb2: {
        position: "absolute",
        bottom: "60px",
        right: "-60px",
        width: "320px",
        height: "320px",
        borderRadius: "50%",
        background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
        pointerEvents: "none",
        opacity: 0.15,
    },
    orb3: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "250px",
        height: "250px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
    },
    grid: {
        position: "absolute",
        inset: 0,
        backgroundImage: `
            linear-gradient(rgba(15, 23, 42, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.02) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
    },
    leftInner: {
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "44px 48px",
    },
    leftLogo: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    logoIcon: { fontSize: "22px" },
    logoText: {
        fontSize: "17px",
        fontWeight: 800,
        letterSpacing: "0.18em",
        color: "#0f172a",
    },
    heroBlock: { marginTop: "auto", paddingTop: "60px" },
    heroTitle: {
        fontSize: "38px",
        fontWeight: 800,
        color: "#0f172a",
        lineHeight: 1.2,
        letterSpacing: "-0.03em",
        margin: "0 0 16px 0",
    },
    heroSub: {
        fontSize: "15px",
        color: "#475569",
        lineHeight: 1.7,
        maxWidth: "320px",
        margin: 0,
    },
    pillRow: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "40px",
    },
    pill: {
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 16px",
        border: "1px solid",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.6)",
        backdropFilter: "blur(8px)",
        width: "fit-content",
        cursor: "default",
    },
    secBadge: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "auto",
        paddingTop: "48px",
        color: "#64748b",
    },
    right: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: "40px 32px",
    },
    formCard: { width: "100%", maxWidth: "420px" },
    formHeader: { marginBottom: "32px" },
    formEyebrow: {
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.14em",
        color: "#6366f1",
        margin: "0 0 10px 0",
    },
    formTitle: {
        fontSize: "26px",
        fontWeight: 800,
        color: "#0f172a",
        letterSpacing: "-0.03em",
        margin: "0 0 8px 0",
        lineHeight: 1.2,
    },
    formSub: {
        fontSize: "14px",
        color: "#64748b",
        margin: 0,
        lineHeight: 1.6,
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: "7px",
    },
    label: {
        fontSize: "13px",
        fontWeight: 600,
        color: "#374151",
        letterSpacing: "0.01em",
    },
    inputWrap: {
        display: "flex",
        alignItems: "center",
        background: "#fff",
        border: "1.5px solid #e2e8f0",
        borderRadius: "10px",
        padding: "0 14px",
        gap: "10px",
        transition: "box-shadow 0.2s, border-color 0.2s",
    },
    inputIcon: { fontSize: "16px", flexShrink: 0 },
    input: {
        flex: 1,
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: "14px",
        color: "#0f172a",
        padding: "13px 0",
        fontFamily: "inherit",
    },
    hint: { fontSize: "12px", color: "#94a3b8", margin: 0 },
    errorBox: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 14px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "10px",
        color: "#dc2626",
        fontSize: "13px",
        fontWeight: 500,
    },
    btn: {
        width: "100%",
        padding: "14px",
        background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
        color: "var(--primary-foreground)",
        border: "none",
        borderRadius: "var(--radius)",
        fontSize: "15px",
        fontWeight: 600,
        fontFamily: "inherit",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        transition: "box-shadow 0.2s, transform 0.15s",
        marginTop: "4px",
    },
    spinner: {
        display: "inline-block",
        width: "16px",
        height: "16px",
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
    },
    divRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        margin: "28px 0 20px",
    },
    divLine: { flex: 1, height: "1px", background: "#e2e8f0" },
    divText: {
        fontSize: "11px",
        color: "#94a3b8",
        whiteSpace: "nowrap",
        fontWeight: 500,
    },
    legend: { display: "flex", flexDirection: "column", gap: "10px" },
    legendRow: { display: "flex", alignItems: "center", gap: "10px" },
    dot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
    legendText: { fontSize: "13px", color: "#475569" },
};
