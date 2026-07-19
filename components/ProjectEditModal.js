"use client";

import { useState, useEffect } from "react";

import LocationPicker from "./LocationPicker";

const DEFAULT_EXPENSE_HEADS = ["Fuel", "Food", "Material", "Labour", "Misc"];

export default function ProjectEditModal({ isOpen, onClose, project, onProjectUpdated }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedHeads, setSelectedHeads] = useState([]);
    const [customHead, setCustomHead] = useState("");
    const [status, setStatus] = useState("ACTIVE");
    const [budget, setBudget] = useState("");
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [managerIds, setManagerIds] = useState([]);
    const [managers, setManagers] = useState([]);

    useEffect(() => {
        if (project && isOpen) {
            setName(project.name || "");
            setDescription(project.description || "");
            setSelectedHeads(project.expense_heads || []);
            setStatus(project.status || "ACTIVE");
            setBudget(project.budget || "");

            if (project.site) {
                setLatitude(project.site.latitude);
                setLongitude(project.site.longitude);
            } else {
                setLatitude("");
                setLongitude("");
            }

            setManagerIds(project.managers?.map(m => m.id) || []);
            setError("");

            fetch("/api/members")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setManagers(data.filter(m => m.role === "PROJECT_MANAGER"));
                    }
                })
                .catch(err => console.error("Failed to fetch managers", err));
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const toggleHead = (head) => {
        setSelectedHeads(prev =>
            prev.includes(head)
                ? prev.filter(h => h !== head)
                : [...prev, head]
        );
    };

    const addCustomHead = () => {
        const trimmed = customHead.trim();
        if (trimmed && !selectedHeads.includes(trimmed)) {
            setSelectedHeads(prev => [...prev, trimmed]);
            setCustomHead("");
        }
    };

    const removeCustomHead = (head) => {
        setSelectedHeads(prev => prev.filter(h => h !== head));
    };

    const handleLocationChange = (lat, lng) => {
        setLatitude(lat);
        setLongitude(lng);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (managerIds.length === 0) {
            setError("At least one manager must be assigned.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    description,
                    expense_heads: selectedHeads,
                    status,
                    budget,
                    manager_ids: managerIds,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update project");
            }

            const updatedProject = await response.json();
            onProjectUpdated(updatedProject);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const customHeads = selectedHeads.filter(h => !DEFAULT_EXPENSE_HEADS.includes(h));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content fade-up" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 700 }}>✏️ Edit Project</h2>
                    <button className="btn-ghost" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "12px", borderRadius: "10px", marginBottom: "16px", fontSize: "14px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>Project Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter project name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <LocationPicker
                        latitude={latitude}
                        longitude={longitude}
                        onLocationChange={handleLocationChange}
                    />

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>Budget (₹)</label>
                        <input
                            type="number"
                            className="input-field"
                            placeholder="Enter total budget (optional)"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>
                            Assign Managers (Required)
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", maxHeight: "120px", overflowY: "auto", padding: "4px" }}>
                            {managers.map(m => (
                                <label
                                    key={m.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 14px",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        transition: "all 0.2s ease",
                                        background: managerIds.includes(m.id) ? "rgba(59,130,246,0.1)" : "rgba(0,0,0,0.03)",
                                        color: managerIds.includes(m.id) ? "var(--primary)" : "var(--text-muted)",
                                        border: managerIds.includes(m.id) ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(0,0,0,0.06)",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={managerIds.includes(m.id)}
                                        onChange={() => {
                                            setManagerIds(prev => prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]);
                                        }}
                                        style={{ accentColor: "var(--primary)", width: "15px", height: "15px" }}
                                    />
                                    {m.name || m.phone}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>Status</label>
                        <select
                            className="input-field"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            style={{ appearance: "none", cursor: "pointer" }}
                        >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="FINISHED">FINISHED</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>Description (Optional)</label>
                        <textarea
                            className="input-field"
                            placeholder="Brief project overview..."
                            style={{ minHeight: "80px", resize: "vertical" }}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "10px", fontSize: "14px", fontWeight: 500, color: "var(--text-muted)" }}>Expense Heads</label>

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                            {DEFAULT_EXPENSE_HEADS.map(head => (
                                <label
                                    key={head}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        padding: "8px 14px",
                                        borderRadius: "10px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        transition: "all 0.2s ease",
                                        background: selectedHeads.includes(head) ? "rgba(59,130,246,0.1)" : "rgba(0,0,0,0.03)",
                                        color: selectedHeads.includes(head) ? "var(--primary)" : "var(--text-muted)",
                                        border: selectedHeads.includes(head) ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(0,0,0,0.06)",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedHeads.includes(head)}
                                        onChange={() => toggleHead(head)}
                                        style={{ accentColor: "var(--primary)", width: "15px", height: "15px" }}
                                    />
                                    {head}
                                </label>
                            ))}
                        </div>

                        {customHeads.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                                {customHeads.map(head => (
                                    <span
                                        key={head}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            background: "rgba(16,185,129,0.1)",
                                            color: "#10b981",
                                            border: "1px solid rgba(16,185,129,0.3)",
                                        }}
                                    >
                                        {head}
                                        <button
                                            type="button"
                                            onClick={() => removeCustomHead(head)}
                                            style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer", fontSize: "14px", padding: 0, lineHeight: 1 }}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Add custom expense head..."
                                value={customHead}
                                onChange={(e) => setCustomHead(e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={addCustomHead}
                                style={{ padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }}
                            >
                                + Add
                            </button>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(15, 23, 42, 0.15);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-content {
                    background: #fff;
                    padding: 24px;
                    border-radius: 20px;
                    width: 100%;
                    max-width: 800px;
                    border: 1px solid rgba(15, 23, 42, 0.08);
                    box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.12);
                    backdrop-filter: blur(20px);
                    max-height: 90vh;
                    overflow-y: auto;
                }
                @media (min-width: 640px) {
                    .modal-content {
                        padding: 32px;
                    }
                }
                @media (max-width: 480px) {
                    .modal-content {
                        padding: 16px;
                        border-radius: 16px;
                    }
                    .modal-overlay {
                        padding: 12px;
                    }
                }
            `}</style>
        </div>
    );
}
