"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Toast from "./Toast";
import ExpenseDetailModal from "./ExpenseDetailModal";

export default function PaymentRequestList({ refreshTrigger, role, limit = null, showFilter = false }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);
    const [lastActionTimes, setLastActionTimes] = useState({}); // { "id-action": timestamp }
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState(null);
    const [statusFilter, setStatusFilter] = useState(role === "PROJECT_MANAGER" ? "PENDING_PM" : "ALL"); // Explicit states
    const [actionInProgress, setActionInProgress] = useState(null); // Track which request is being processed
    const [showAll, setShowAll] = useState(false); // For "View More" functionality
    const [expandedNotes, setExpandedNotes] = useState({}); // { requestId: boolean }
    const [pmNotes, setPmNotes] = useState({}); // { requestId: string }
    const [savingNote, setSavingNote] = useState({}); // { requestId: boolean }
    const [selectedRequest, setSelectedRequest] = useState(null); // Request to show in modal
    const [budgetDialog, setBudgetDialog] = useState(null); // { pendingArgs, budgetData }


    const fetchRequests = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (role === "SUPER_ADMIN" || role === "PROJECT_MANAGER") {
                params.append("status", statusFilter);
            }
            if (selectedProjectId) {
                params.append("project", selectedProjectId);
            }
            if (role === "MANAGER_OWN_REQUESTS") {
                params.append("own", "true");
            }
            if (limit) {
                params.append("limit", limit);
            }
            const res = await fetch(`/api/payment-requests?${params.toString()}`);
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            // Add a small delay so the user can actually see the beautiful shimmer effect
            setTimeout(() => setLoading(false), 800);
        }
    };

    const initialSelectRef = useRef(false);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            const projectList = Array.isArray(data) ? data : [];
            setProjects(projectList);
            if (projectList.length > 0 && selectedProjectId === null && !initialSelectRef.current) {
                // setSelectedProjectId(projectList[0].id);
                // initialSelectRef.current = true;
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [refreshTrigger, role, showFilter, statusFilter, selectedProjectId]);

    useEffect(() => {
        if (role === "SUPER_ADMIN" || role === "PROJECT_MANAGER" || role === "MANAGER_OWN_REQUESTS" || (showFilter && role === "SUPERVISOR")) {
            fetchProjects();
        }
    }, [role, showFilter]);

    const addToast = (title, message, type = "success") => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, title, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const handleAction = async (id, action, isClubbed = false, requestIds = [], projectId = null, currentPct = 0, isSubRequest = false, overrideBudget = false) => {
        // id is used for the key (e.g., 'group-1-date' for clubbed)
        const actionKey = `${id}-${action}`;
        const now = Date.now();
        const lastTime = lastActionTimes[actionKey] || 0;

        const body = {};
        if (overrideBudget) body.overrideBudget = true;


        // Cooldown check (5 seconds = 5000ms)
        if (now - lastTime < 5000) {
            console.log("Cooldown active for this action");
            addToast("Please Wait", "Please wait a moment before trying again.", "error");
            return;
        }

        // Prevent multiple actions on same request/group
        if (actionInProgress === id) {
            return;
        }

        // Auto-save note if present
        if (pmNotes[id]) {
            const success = await handleSavePMNote(id, projectId, currentPct, true);
            if (!success) {
                addToast("Note Failed", "Failed to save the note before approval. Action cancelled.", "error");
                return;
            }
        }

        setActionInProgress(id);

        try {
            // If clubbed, join IDs into a comma-separated string for the bulk-enabled APIs
            const targetId = isClubbed && requestIds.length > 0 ? requestIds.join(",") : id;
            const res = await fetch(`/api/payment-requests/${targetId}/${action}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.status === 409) {
                const data = await res.json();
                if (data.error === "BUDGET_EXCEEDED") {
                    setBudgetDialog({
                        pendingArgs: [id, action, isClubbed, requestIds, projectId, currentPct, isSubRequest],
                        budgetData: data
                    });
                    setActionInProgress(null);
                    return;
                }
            }

            if (res.ok) {
                setLastActionTimes(prev => ({ ...prev, [actionKey]: now }));

                // Optimistic update
                if (isSubRequest && action === "reject") {
                    setRequests(prev => prev.map(req => {
                        if (req.isClubbed && req.subRequests) {
                            const updatedSubReqs = req.subRequests.filter(s => s.id !== id);
                            if (updatedSubReqs.length === 0) return null; // Remove group completely if empty
                            
                            return {
                                ...req,
                                subRequests: updatedSubReqs,
                                requestIds: updatedSubReqs.map(s => s.id),
                                materials: updatedSubReqs.flatMap(s => s.materials),
                                total_amount: updatedSubReqs.reduce((sum, s) => sum + parseFloat(s.total_amount), 0)
                            };
                        }
                        return req;
                    }).filter(Boolean));
                } else {
                    setRequests(prev => prev.filter(req => {
                        // Check both ID types for clubbed vs single
                        const groupKey = req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id;
                        return groupKey !== id;
                    }));
                }

                addToast(
                    action === "approve" ? "Request Approved ✓" : "Request Rejected ✗",
                    `The payment request ${isClubbed ? "group" : ""} has been ${action === "approve" ? "approved" : "rejected"}.`,
                    action === "approve" ? "success" : "error"
                );

                // Refresh list in background
                setTimeout(() => fetchRequests(), 1000);
            } else {
                addToast("Action Failed", "Something went wrong while processing the request.", "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Network Error", "Unable to connect to the server.", "error");
        } finally {
            setActionInProgress(null);
        }
    };

    const handleBudgetOverride = async () => {
        if (!budgetDialog) return;
        const [id, action, isClubbed, requestIds, projectId, currentPct, isSubRequest] = budgetDialog.pendingArgs;
        setBudgetDialog(null);
        await handleAction(id, action, isClubbed, requestIds, projectId, currentPct, isSubRequest, true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING_PM": return "#f59e0b";
            case "PENDING_ADMIN": return "#3b82f6";
            case "PAID": return "#10b981";
            case "REJECTED": return "#f87171";
            default: return "var(--text-muted)";
        }
    };

    const getProgressColor = (pct) => {
        if (pct >= 75) return "#10b981";
        if (pct >= 50) return "#3b82f6";
        if (pct >= 25) return "#f59e0b";
        return "#ef4444";
    };

    const toggleNotes = (id) => {
        setExpandedNotes(prev => ({ ...prev, [id]: !prev[id] }));
    };



    const handleSavePMNote = async (requestId, projectId, currentPct, silent = false) => {
        const note = pmNotes[requestId];
        if (!note || !note.trim()) return true;

        if (!silent) setSavingNote(prev => ({ ...prev, [requestId]: true }));
        try {
            const today = new Date();
            const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

            const res = await fetch(`/api/projects/${projectId}/progress`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    percentage: currentPct,
                    date: dateStr,
                    notes: `[${role === "SUPER_ADMIN" ? "Admin" : "Manager"} Note] ${note}`
                })
            });

            if (res.ok) {
                if (!silent) addToast("Note Saved", "Your note has been added to the project progress.", "success");
                setPmNotes(prev => ({ ...prev, [requestId]: "" }));
                if (!silent) fetchRequests();
                return true;
            } else {
                if (!silent) addToast("Error", "Failed to save note.", "error");
                return false;
            }
        } catch (err) {
            console.error("Error saving PM note:", err);
            if (!silent) addToast("Error", "An unexpected error occurred.", "error");
            return false;
        } finally {
            if (!silent) setSavingNote(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const handleDeleteRequest = async (id) => {
        if (!confirm("Are you sure you want to delete this expense request?")) return;
        
        try {
            const res = await fetch(`/api/payment-requests/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                addToast("Deleted", "The request has been deleted.", "success");
                setRequests(prev => prev.filter(r => r.id !== id));
            } else {
                addToast("Failed", "Could not delete the request.", "error");
            }
        } catch (err) {
            console.error("Error deleting request:", err);
            addToast("Error", "Network error.", "error");
        }
    };

    let filteredRequests = requests;
    
    if (selectedProjectId && (role === "SUPER_ADMIN" || role === "MANAGER_OWN_REQUESTS" || (showFilter && role === "SUPERVISOR"))) {
        filteredRequests = filteredRequests.filter(req => req.project_id === selectedProjectId);
    }
    
    if (role === "SUPER_ADMIN" && statusFilter !== "ALL") {
        filteredRequests = filteredRequests.filter(req => req.status === statusFilter);
    }

    // Apply limit for display (if not showing all)
    const displayedRequests = !showAll && limit ? filteredRequests.slice(0, limit) : filteredRequests;

    return (
        <div className="fade-up-2">
            <style>{`
                @keyframes premium-shimmer-anim {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                .premium-shimmer {
                    background: #f1f5f9;
                    background-image: linear-gradient(
                        to right,
                        #f1f5f9 0%,
                        #e2e8f0 20%,
                        #f1f5f9 40%,
                        #f1f5f9 100%
                    );
                    background-repeat: no-repeat;
                    background-size: 1000px 100%;
                    display: block;
                    position: relative;
                    animation: premium-shimmer-anim 2s linear infinite;
                }
            `}</style>
            <Toast toasts={toasts} />
            <h2 className="section-title">{role === "SUPERVISOR" || role === "MANAGER_OWN_REQUESTS" ? "Recent Requests" : "Pending Approvals"}</h2>

            {(role === "SUPER_ADMIN" || role === "PROJECT_MANAGER" || role === "MANAGER_OWN_REQUESTS" || (showFilter && role === "SUPERVISOR")) && (
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div>
                        <label className="stat-label">Filter by Project</label>
                        <select
                            className="input-field"
                            style={{ maxWidth: "300px", marginTop: "8px" }}
                            value={selectedProjectId || ""}
                            onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
                            disabled={loading}
                        >
                            <option value="">All Projects</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    {(role === "SUPER_ADMIN" || role === "PROJECT_MANAGER") && (
                        <div>
                            <label className="stat-label">Filter by Status</label>
                            <select
                                className="input-field"
                                style={{ maxWidth: "250px", marginTop: "8px" }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                disabled={loading}
                            >
                                <option value="ALL">All Requests</option>
                                <option value="PENDING_ADMIN">Manager Approved</option>
                                <option value="PENDING_PM">Pending PM</option>
                                <option value="PAID">Paid</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="premium-shimmer" style={{ height: "400px", width: "100%", borderRadius: "20px", border: "1px solid #e2e8f0" }}></div>
            ) : filteredRequests.length === 0 ? (
                <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    {(role === "SUPER_ADMIN" || role === "PROJECT_MANAGER" || role === "MANAGER_OWN_REQUESTS" || (showFilter && role === "SUPERVISOR")) && selectedProjectId
                        ? "No payment requests found for this project."
                        : "No payment requests found."}
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {displayedRequests.map((req) => (
                        <div key={req.isClubbed ? `${req.project_id}-${req.created_at}-${req.status}` : req.id} className="glass-card" style={{ padding: "24px", paddingTop: req.isClubbed ? "12px" : "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", borderLeft: req.isClubbed ? "4px solid var(--primary)" : "none" }}>
                            <div style={{ flex: "1 1 300px", minWidth: "0" }}>
                                {req.isClubbed && (
                                    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--primary)", letterSpacing: "0.5px", marginBottom: "8px" }}>
                                        📅 Day Summary • Grouped by Date
                                    </div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                                    <span style={{ fontWeight: 700, fontSize: "16px" }}>{req.project?.name}</span>
                                    <span className="role-badge" style={{ background: `${getStatusColor(req.status)}20`, color: getStatusColor(req.status), border: `1px solid ${getStatusColor(req.status)}30` }}>
                                        {(req.isClubbed && req.requestIds?.length > 1) ? `${req.status.replace("_", " ")} (ALL)` : req.status.replace("_", " ")}
                                    </span>
                                </div>
                                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                                    {req.isClubbed ? "Requested by: " : "Requested by: "}{req.supervisor?.name || "Self"} • {new Date(req.created_at).toLocaleDateString()}
                                    {req.status === "REJECTED" && req.pm?.name && (
                                        <div style={{ marginTop: "4px", color: "#f87171", fontSize: "12px", fontWeight: 500 }}>
                                            ❌ Rejected by: {req.pm.name}
                                        </div>
                                    )}
                                    {req.status === "PAID" && req.pm?.name && (
                                        <div style={{ marginTop: "4px", color: "#10b981", fontSize: "12px", fontWeight: 500 }}>
                                            ✓ Approved by: {req.pm.name}
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button 
                                            className="btn-ghost"
                                            style={{ padding: "8px 16px", fontSize: "12px", border: "1px solid var(--border)" }}
                                            onClick={() => setSelectedRequest(req)}
                                        >
                                            📄 View Details
                                        </button>
                                        
                                        {((role === "SUPERVISOR" && req.status === "PENDING_PM") || (role === "MANAGER_OWN_REQUESTS" && (req.status === "PENDING_ADMIN" || req.status === "PENDING_PM"))) && !req.isClubbed && (
                                            <>
                                                <Link 
                                                    href={`/${role === "SUPERVISOR" ? "supervisor" : "manager"}/dashboard/edit-expense/${req.id}`}
                                                    className="btn-ghost"
                                                    style={{ padding: "8px 16px", fontSize: "12px", border: "1px solid var(--primary)", color: "var(--primary)", textDecoration: "none", display: "inline-block" }}
                                                >
                                                    ✏️ Edit
                                                </Link>
                                                <button 
                                                    className="btn-ghost"
                                                    style={{ padding: "8px 16px", fontSize: "12px", border: "1px solid #fecaca", color: "#ef4444", background: "#fef2f2" }}
                                                    onClick={() => handleDeleteRequest(req.id)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {req.isClubbed && req.subRequests && role === "PROJECT_MANAGER" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px", borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
                                                {req.subRequests.map((sub) => (
                                                    <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px", background: "rgba(15, 23, 42, 0.02)", borderRadius: "6px", border: "1px solid rgba(15, 23, 42, 0.05)" }}>
                                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>
                                                            Req #{sub.id} (₹{parseFloat(sub.total_amount).toLocaleString()})
                                                        </span>
                                                        {req.status === "PENDING_PM" && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleAction(sub.id, "reject", false, [], sub.project_id, req.progress?.percentage || 0, true);
                                                                }}
                                                                title="Reject & Remove this specific request"
                                                                style={{ border: "none", background: "rgba(248, 113, 113, 0.1)", color: "#ef4444", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                            >
                                                                ❌ Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>



                            </div>

                            <div style={{ textAlign: "right", flex: "1 1 100%", smFlex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <div className="stat-value" style={{ fontSize: "20px", marginBottom: "12px" }}>
                                    ₹{parseFloat(req.total_amount).toLocaleString()}
                                </div>

                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", width: "100%" }}>
                                    {(role === "PROJECT_MANAGER" && req.status === "PENDING_PM") || (role === "SUPER_ADMIN" && req.status === "PENDING_ADMIN") ? (
                                        <>
                                            <button
                                                className="btn-ghost"
                                                onClick={() => {
                                                    const groupId = req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id;
                                                    handleAction(groupId, "reject", req.isClubbed, req.requestIds, req.project_id, req.progress?.percentage || 0);
                                                }}
                                                style={{
                                                    color: "#64748b",
                                                    flex: 1,
                                                    whiteSpace: "nowrap",
                                                    opacity: actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id) ? 0.5 : 1,
                                                    cursor: actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id) ? 'not-allowed' : 'pointer',
                                                    border: '1px solid var(--border)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = '#f1f5f9';
                                                    e.target.style.borderColor = '#cbd5e1';
                                                    e.target.style.color = '#475569';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'transparent';
                                                    e.target.style.borderColor = 'var(--border)';
                                                    e.target.style.color = '#64748b';
                                                }}
                                                disabled={actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id)}
                                            >
                                                {actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id) ? "Processing..." : (req.isClubbed && req.requestIds?.length > 1) ? "Reject All" : "Reject"}
                                            </button>
                                            <button
                                                className="btn-primary"
                                                onClick={() => {
                                                    const groupId = req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id;
                                                    handleAction(groupId, "approve", req.isClubbed, req.requestIds, req.project_id, req.progress?.percentage || 0);
                                                }}
                                                style={{
                                                    width: "auto",
                                                    padding: "8px 20px",
                                                    flex: 1,
                                                    whiteSpace: "nowrap",
                                                    opacity: actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id) ? 0.5 : 1,
                                                    cursor: actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id) ? 'not-allowed' : 'pointer'
                                                }}
                                                disabled={actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id)}
                                            >
                                                {actionInProgress === (req.isClubbed ? (role === "PROJECT_MANAGER" ? `${req.project_id}-${req.status}-PM_GROUP` : `${req.project_id}-${new Date(req.created_at).toLocaleDateString("en-IN")}-${req.status}`) : req.id) ? "Processing..." : (req.isClubbed && req.requestIds?.length > 1) ? "Approve All" : "Approve"}
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View More Button for Supervisors */}
            {showFilter && role === "SUPERVISOR" && filteredRequests.length > (limit || 3) && !showAll && (
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <button
                        className="btn-ghost"
                        onClick={() => setShowAll(true)}
                        style={{
                            padding: "10px 32px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "underline",
                            textUnderlineOffset: "4px"
                        }}
                    >
                        View More ({filteredRequests.length - (limit || 3)} more)
                    </button>
                </div>
            )}

            {/* View All Button for Super Admin */}
            {role === "SUPER_ADMIN" && filteredRequests.length > 3 && !showAll && (
                <div style={{ textAlign: "center", marginTop: "24px" }}>
                    <button
                        className="btn-ghost"
                        onClick={() => setShowAll(true)}
                        style={{
                            padding: "10px 32px",
                            fontSize: "14px",
                            fontWeight: 600,
                            textDecoration: "underline",
                            textUnderlineOffset: "4px"
                        }}
                    >
                        View All ({filteredRequests.length - 3} more requests)
                    </button>
                </div>
            )}
            <ExpenseDetailModal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
                role={role}
            />

            {/* Budget Exceeded Dialog */}
            {budgetDialog && (() => {
                const bd = budgetDialog.budgetData;
                const pct = Math.min(((bd.currentExpenses + bd.approvingAmount) / bd.allocatedBudget) * 100, 150);
                const spentPct = Math.min((bd.currentExpenses / bd.allocatedBudget) * 100, 100);
                const overflowPct = Math.min(pct - spentPct, 100 - spentPct);
                return (
                    <div style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        padding: "70px 16px 16px",
                        overflowY: "auto",
                    }}>
                        {/* Backdrop */}
                        <div
                            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
                            onClick={() => setBudgetDialog(null)}
                        />
                        {/* Card — max height with inner scroll */}
                        <div style={{
                            position: "relative",
                            background: "#fff",
                            borderRadius: "20px",
                            width: "100%",
                            maxWidth: "440px",
                            maxHeight: "min(80vh, 600px)",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                            border: "2px solid #fecaca",
                            animation: "fadeUp 0.25s ease both",
                        }}>
                            {/* Scrollable body */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
                                {/* Title */}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                    <div style={{
                                        width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
                                        background: "#fee2e2", border: "1.5px solid #fca5a5",
                                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
                                    }}>🚨</div>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: "16px", color: "#991b1b", lineHeight: 1.2 }}>Budget Limit Exceeded!</div>
                                        <div style={{ fontSize: "12px", color: "#b45309", marginTop: "2px" }}>Approving this will cross the project budget.</div>
                                    </div>
                                </div>

                                {/* 2×2 grid breakdown */}
                                <div style={{ background: "#fef2f2", borderRadius: "12px", padding: "12px", border: "1px solid #fecaca", marginBottom: "12px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                                        {[
                                            { label: "Allocated", value: bd.allocatedBudget, color: "#1e40af" },
                                            { label: "Already Spent", value: bd.currentExpenses, color: "#92400e" },
                                            { label: "This Request", value: bd.approvingAmount, color: "#b45309" },
                                            { label: "Remaining", value: bd.remainingBudget, color: "#065f46" },
                                        ].map(row => (
                                            <div key={row.label} style={{ background: "#fff", borderRadius: "8px", padding: "9px 11px", border: "1px solid #fca5a520" }}>
                                                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 500, marginBottom: "2px" }}>{row.label}</div>
                                                <div style={{ fontSize: "13px", fontWeight: 700, color: row.color }}>₹{Number(row.value).toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 4px 2px", borderTop: "1px solid #fca5a5" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#991b1b" }}>⚠️ Overrun</span>
                                        <span style={{ fontSize: "15px", fontWeight: 800, color: "#ef4444" }}>₹{Number(bd.amountExceeded).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#6b7280", marginBottom: "5px" }}>
                                        <span>Utilization after approval</span>
                                        <span style={{ fontWeight: 700, color: pct > 100 ? "#ef4444" : "#f59e0b" }}>{pct.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: "8px", borderRadius: "999px", background: "#e5e7eb", overflow: "hidden", position: "relative" }}>
                                        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${spentPct}%`, background: "#f59e0b" }} />
                                        <div style={{ position: "absolute", left: `${spentPct}%`, top: 0, height: "100%", width: `${overflowPct}%`, background: "#ef4444" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                        <span style={{ fontSize: "10px", color: "#92400e", display: "flex", alignItems: "center", gap: "3px" }}>
                                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />Already spent
                                        </span>
                                        <span style={{ fontSize: "10px", color: "#991b1b", display: "flex", alignItems: "center", gap: "3px" }}>
                                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />This request
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Fixed footer — always visible, never scrolls */}
                            <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #fee2e2", flexShrink: 0 }}>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "7px" }}>
                                    <button
                                        onClick={() => setBudgetDialog(null)}
                                        style={{
                                            flex: 1, padding: "12px", borderRadius: "10px",
                                            border: "1.5px solid #e5e7eb", background: "#f9fafb",
                                            color: "#374151", fontWeight: 600, fontSize: "14px", cursor: "pointer"
                                        }}
                                    >Cancel</button>
                                    <button
                                        onClick={handleBudgetOverride}
                                        style={{
                                            flex: 1, padding: "12px", borderRadius: "10px", border: "none",
                                            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                                            color: "#fff", fontWeight: 700, fontSize: "14px", cursor: "pointer",
                                            boxShadow: "0 4px 14px rgba(239,68,68,0.3)"
                                        }}
                                    >Force Approve</button>
                                </div>
                                <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af", textAlign: "center" }}>
                                    This action will be flagged for audit.
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
