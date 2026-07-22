"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

export default function ExpenseDetailModal({ isOpen, onClose, request, role }) {
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen || !request) return null;

    const materials = request.materials || [];
    const notes = request.progress?.notes || [];
    const completionPercentage = request.progress?.percentage || 0;

    const handleViewAllNotes = () => {
        onClose();
        if (role === "SUPER_ADMIN") {
            router.push("/superadmin/projects/progress");
        } else if (role === "PROJECT_MANAGER") {
            router.push("/manager/projects/progress");
        } else {
            router.push("/supervisor/dashboard/progress");
        }
    };

    return createPortal(
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Expense Details</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={styles.completionBadge}>
                            {completionPercentage}% Completed
                        </div>
                        <button style={styles.closeBtn} onClick={onClose}>✕</button>
                    </div>
                </div>
                
                <div style={styles.content}>
                    {/* Notes Section */}
                    {notes.length > 0 && (
                        <div style={styles.section}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <h3 style={styles.sectionTitle}>📝 Project Progress Notes</h3>
                                {notes.length > 0 && (
                                    <button 
                                        onClick={handleViewAllNotes}
                                        style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                                    >
                                        View All
                                    </button>
                                )}
                            </div>
                            <div style={styles.notesContainer}>
                                {notes.slice(0, 5).map((note, idx) => (
                                    <div key={idx} style={styles.noteCard}>
                                        <div style={styles.noteMeta}>
                                            <span>{note.date}</span>
                                            <span>{note.percentage}% Complete</span>
                                        </div>
                                        <p style={styles.noteText}>{note.notes || "No additional description provided."}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Materials Section */}
                    <div style={styles.section}>
                        <h3 style={styles.sectionTitle}>🛒 Requested Expenses</h3>
                        <div style={styles.materialsList}>
                            {materials.map((m, idx) => (
                                <div key={idx} style={styles.materialItem}>
                                    <div style={styles.materialInfo}>
                                        <div style={styles.materialName}>{m.name}</div>
                                        <div style={styles.materialMeta}>
                                            Qty: {m.quantity} • Price: ₹{parseFloat(m.unit_price).toLocaleString()}
                                        </div>
                                        {m.description && (
                                            <div style={styles.materialDescription}>
                                                {m.description}
                                            </div>
                                        )}
                                    </div>
                                    {m.image_url && (
                                        <div style={styles.materialImageContainer}>
                                            <a href={m.image_url} target="_blank" rel="noopener noreferrer" style={styles.imageLink}>
                                                <img src={m.image_url} alt={m.name} style={styles.materialImage} />
                                                <div style={styles.imageOverlay}>📷 VIEW</div>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.totalSection}>
                        <span style={styles.totalLabel}>Total Amount:</span>
                        <span style={styles.totalValue}>₹{parseFloat(request.total_amount).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

const styles = {
    overlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
    },
    modal: {
        backgroundColor: "#fff",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "600px",
        maxHeight: "85vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1px solid #f1f5f9"
    },
    title: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 700,
        color: "#0f172a"
    },
    completionBadge: {
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        color: "#10b981",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 700,
        border: "1px solid rgba(16, 185, 129, 0.2)"
    },
    closeBtn: {
        background: "none",
        border: "none",
        fontSize: "20px",
        color: "#64748b",
        cursor: "pointer",
        padding: "4px"
    },
    content: {
        padding: "24px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    sectionTitle: {
        margin: 0,
        fontSize: "14px",
        fontWeight: 600,
        color: "#475569",
        textTransform: "uppercase",
        letterSpacing: "0.05em"
    },
    notesContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    noteCard: {
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        padding: "16px"
    },
    noteMeta: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "12px",
        fontWeight: 600,
        color: "#64748b",
        marginBottom: "8px"
    },
    noteText: {
        margin: 0,
        fontSize: "14px",
        color: "#334155",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap"
    },
    materialsList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },
    materialItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 16px",
        backgroundColor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
    },
    materialInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    materialName: {
        fontSize: "15px",
        fontWeight: 600,
        color: "#1e293b"
    },
    materialMeta: {
        fontSize: "13px",
        color: "#64748b"
    },
    materialDescription: {
        fontSize: "13px",
        color: "#475569",
        marginTop: "4px",
        padding: "6px 10px",
        backgroundColor: "#f8fafc",
        borderRadius: "6px",
        borderLeft: "3px solid #cbd5e1",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap"
    },
    materialImageContainer: {
        width: "50px",
        height: "50px",
        borderRadius: "8px",
        overflow: "hidden",
        position: "relative",
        border: "1px solid #e2e8f0"
    },
    imageLink: {
        display: "block",
        width: "100%",
        height: "100%",
        textDecoration: "none"
    },
    materialImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },
    imageOverlay: {
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontSize: "9px",
        fontWeight: 700,
        textAlign: "center",
        padding: "2px 0"
    },
    totalSection: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "16px",
        borderTop: "1px solid #e2e8f0",
        marginTop: "8px"
    },
    totalLabel: {
        fontSize: "16px",
        fontWeight: 600,
        color: "#475569"
    },
    totalValue: {
        fontSize: "20px",
        fontWeight: 800,
        color: "#0f172a"
    }
};
