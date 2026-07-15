"use client";

import { useState, useEffect, useRef } from "react";
import CameraCapture from "./CameraCapture";
import Image from "next/image";
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function UnifiedExpenseBillForm({ onSuccess }) {
    // --- Shared State ---
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);

    // --- Expense / Material State ---
    const [materials, setMaterials] = useState([{ name: "", quantity: "", unit_price: "", image_url: "", image_file_id: "", worker_id: null, worker_name: "", is_recurring: false, reminder_day: "" }]);
    const [expenseHeads, setExpenseHeads] = useState([]);
    const [uploadingMaterial, setUploadingMaterial] = useState(null); // index of material being uploaded
    const [suggestions, setSuggestions] = useState({}); // { worker_id: ["Expense 1", "Expense 2"] }
    const [workerSearchOpen, setWorkerSearchOpen] = useState({}); // { index: boolean }
    const [showCamera, setShowCamera] = useState(false);
    const [activeMaterialIndex, setActiveMaterialIndex] = useState(null);
    const [prevProjectId, setPrevProjectId] = useState("");
    const materialFileInputRef = useRef(null);

    // --- General Bill State ---
    const [billName, setBillName] = useState("");
    const [billAmount, setBillAmount] = useState("");
    const [billPreviewUrl, setBillPreviewUrl] = useState(null);
    const [billUploadData, setBillUploadData] = useState({ url: "", fileId: "" });
    const [isUploadingBill, setIsUploadingBill] = useState(false);

    // --- Fetch Projects ---
    useEffect(() => {
        fetch("/api/projects?status=ACTIVE")
            .then(res => res.json())
            .then(data => {
                setProjects(data);
            })
            .catch(err => console.error("Error fetching projects:", err));
    }, []);

    // --- Handle Project Change (Update Expense Heads) ---
    useEffect(() => {
        if (selectedProject) {
            const project = projects.find(p => p.id === parseInt(selectedProject));
            if (project && project.expense_heads && project.expense_heads.length > 0) {
                setExpenseHeads(project.expense_heads);
            } else {
                setExpenseHeads([]);
            }

            // Only reset materials if the project ID actually changed from its previous value
            if (selectedProject !== prevProjectId) {
                setMaterials([{ name: "", quantity: "", unit_price: "", image_url: "", image_file_id: "", worker_id: null, worker_name: "", is_recurring: false, reminder_day: "" }]);
                setPrevProjectId(selectedProject);
            }
        } else {
            setExpenseHeads([]);
            setPrevProjectId("");
        }
    }, [selectedProject, projects, prevProjectId]);

    // --- Shared Authenticator ---
    const authenticator = async () => {
        try {
            const response = await fetch("/api/upload-auth");
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Auth failed (${response.status}): ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Authenticator error:", error);
            throw new Error("Failed to authenticate for upload");
        }
    };

    // --- Worker Autocomplete ---
    // Store per-row: { [index]: { query, results, loading } }
    const [workerSearch, setWorkerSearch] = useState({});

    const getWorkerSearch = (index) => workerSearch[index] || { query: "", results: [], loading: false };

    const handleWorkerQueryChange = (index, query) => {
        setWorkerSearch(prev => ({ ...prev, [index]: { ...getWorkerSearch(index), query, results: prev[index]?.results || [] } }));

        if (query.length >= 2) {
            const timeoutKey = `_t${index}`;
            clearTimeout(handleWorkerQueryChange[timeoutKey]);
            handleWorkerQueryChange[timeoutKey] = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/workers/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    setWorkerSearch(prev => ({ ...prev, [index]: { ...prev[index], results: Array.isArray(data) ? data : [] } }));
                } catch (err) {
                    console.error("Worker search error:", err);
                }
            }, 300);
        } else {
            setWorkerSearch(prev => ({ ...prev, [index]: { ...prev[index], results: [] } }));
        }
    };


    const fetchSuggestions = async (workerId) => {
        if (!workerId || suggestions[workerId]) return;
        try {
            const res = await fetch(`/api/materials/suggestions?worker_id=${workerId}`);
            const data = await res.json();
            setSuggestions(prev => ({ ...prev, [workerId]: Array.isArray(data) ? data : [] }));
        } catch (err) {
            console.error("Suggestions error:", err);
        }
    };

    // --- Material / Expense Handlers ---
    const addMaterial = () => {
        setMaterials([...materials, { name: "", quantity: 1, unit_price: 0, image_url: "", image_file_id: "", worker_id: null, worker_name: "", is_recurring: false, reminder_day: "" }]);
    };

    const removeMaterial = (index) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };

    const updateMaterial = (index, field, value) => {
        const newMaterials = [...materials];
        newMaterials[index][field] = value;
        setMaterials(newMaterials);
    };

    const handleMaterialImageUpload = async (index, fileOrDataUrl) => {
        setUploadingMaterial(index);
        setError("");

        try {
            const authParams = await authenticator();
            const { signature, expire, token, publicKey, urlEndpoint } = authParams;

            const uploadResult = await upload({
                file: fileOrDataUrl,
                fileName: `material_${Date.now()}.jpg`,
                folder: "/materials",
                signature,
                expire,
                token,
                publicKey,
                urlEndpoint,
            });

            updateMaterial(index, "image_url", uploadResult.url);
            updateMaterial(index, "image_file_id", uploadResult.fileId);
        } catch (err) {
            console.error("Material Upload Error:", err);
            let errorMessage = "Failed to upload photo";
            if (err instanceof ImageKitAbortError) errorMessage = "Upload aborted";
            else if (err instanceof ImageKitInvalidRequestError) errorMessage = "Invalid upload request";
            else if (err instanceof ImageKitUploadNetworkError) errorMessage = "Network error during upload";
            else if (err instanceof ImageKitServerError) errorMessage = "ImageKit server error";
            else if (err.message) errorMessage = err.message;
            setError(`Upload Error: ${errorMessage}`);
        } finally {
            setUploadingMaterial(null);
        }
    };

    // --- General Bill Handlers ---
    const handleBillImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploadingBill(true);
        setError("");
        setBillPreviewUrl(URL.createObjectURL(file));

        try {
            const authParams = await authenticator();
            const { signature, expire, token, publicKey, urlEndpoint } = authParams;

            const result = await upload({
                file,
                fileName: `bill_${Date.now()}.png`,
                publicKey,
                urlEndpoint,
                signature,
                expire,
                token
            });

            setBillUploadData({ url: result.url, fileId: result.fileId });
            setBillPreviewUrl(result.url);
        } catch (err) {
            console.error("Bill Upload Error:", err);
            setError("Failed to upload bill image. Please try again.");
            setBillPreviewUrl(null);
        } finally {
            setIsUploadingBill(false);
        }
    };

    const totalAmount = materials.reduce((sum, m) => sum + (m.quantity * (m.unit_price || 0)), 0);

    // --- Unified Submit Handler ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedProject) {
            setError("Please select a project");
            return;
        }

        // Determine what the user is trying to submit
        // They must either provide valid materials OR a valid bill. 
        // We filter out empty materials before deciding.
        const validMaterials = materials.filter(m => m.name && m.unit_price > 0);
        const isSubmittingExpense = validMaterials.length > 0;
        const isSubmittingBill = billName && billUploadData.url;

        if (!isSubmittingExpense && !isSubmittingBill) {
            setError("Please provide details for an expense, a bill, or both.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const promises = [];

            // 1. Submit Expenses if valid
            if (isSubmittingExpense) {
                const expensePromise = fetch("/api/payment-requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        project_id: selectedProject,
                        materials: validMaterials.map(m => ({
                            name: m.name,
                            quantity: Number(m.quantity),
                            unit_price: Number(m.unit_price),
                            image_url: m.image_url,
                            image_file_id: m.image_file_id,
                            worker_id: m.worker_id
                        })),
                        total_amount: validMaterials.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0)
                    })
                }).then(async (res) => {
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to submit expense request");
                    }
                });
                promises.push(expensePromise);

                // Handle reminders for materials that have it enabled
                validMaterials.forEach(m => {
                    if (m.worker_id && m.is_recurring && m.reminder_day) {
                        const reminderPromise = fetch("/api/reminders", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                worker_id: m.worker_id,
                                project_id: selectedProject,
                                amount: Number(m.unit_price) * Number(m.quantity),
                                day_of_month: m.reminder_day,
                                reason: m.name
                            })
                        });
                        promises.push(reminderPromise);
                    }
                });
            }

            // 2. Submit Bill if valid
            if (isSubmittingBill) {
                const billPromise = fetch("/api/bills", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: billName,
                        amount: billAmount,
                        project_id: selectedProject,
                        image_url: billUploadData.url,
                        image_file_id: billUploadData.fileId
                    })
                }).then(async (res) => {
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || "Failed to save bill");
                    }
                });
                promises.push(billPromise);
            }

            // Wait for all active requests
            await Promise.all(promises);

            // Success handling
            setShowSuccess(true);
            setMaterials([{ name: "", quantity: 1, unit_price: 0, image_url: "", image_file_id: "", worker_id: null, worker_name: "", is_recurring: false, reminder_day: "" }]);
            setBillName("");
            setBillAmount("");
            setBillPreviewUrl(null);
            setBillUploadData({ url: "", fileId: "" });
            setSelectedProject("");
            
            setTimeout(() => {
                setShowSuccess(false);
                if (onSuccess) onSuccess();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.message || "An error occurred during submission");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card fade-up" style={{ padding: "32px", marginBottom: "32px" }}>
            <h2 className="section-title">New Expense & Bill Request</h2>

            {showSuccess && (
                <div className="alert-success" style={{ marginBottom: "20px" }}>
                    ✅ Request successfully submitted!
                </div>
            )}

            {error && <div className="alert-error" style={{ marginBottom: "20px" }}>❌ {error}</div>}

            {/* --- Project Selection (Shared) --- */}
            <div style={{ marginBottom: "24px", color: "black" }}>
                <label className="stat-label">Project</label>
                <select
                    className="input-field"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    style={{
                        appearance: "none",
                        cursor: "pointer",
                        color: "#000",
                        backgroundColor: "#fff"
                    }}
                >
                    <option value="" style={{ color: "#555" }}>
                        Select Project
                    </option>
                    {projects.map((p) => (
                        <option key={p.id} value={p.id} style={{ color: "#000" }}>
                            {p.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* --- Expenses & Materials Section --- */}
            <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text)" }}>Add Expenses & Materials</h3>
                {materials.map((m, index) => (
                    <div key={index} style={{ marginBottom: "16px", padding: "16px", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px solid rgba(0,0,0,0.05)" }}>
                        
                        {/* Worker Assignment */}
                        <div style={{ marginBottom: "12px" }}>
                            <Popover open={workerSearchOpen[index]} onOpenChange={(open) => setWorkerSearchOpen(prev => ({ ...prev, [index]: open }))}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className="input-field"
                                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "#fff", cursor: "pointer", height: "42px" }}
                                    >
                                        {m.worker_name ? m.worker_name : <span style={{ color: "var(--text-muted)" }}>Assign Worker (Optional)...</span>}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search worker by name..."
                                            value={getWorkerSearch(index).query}
                                            onValueChange={(q) => handleWorkerQueryChange(index, q)}
                                        />
                                        <CommandList>
                                            {getWorkerSearch(index).query.length < 2 ? (
                                                <CommandEmpty>Type at least 2 characters to search...</CommandEmpty>
                                            ) : getWorkerSearch(index).results.length === 0 ? (
                                                <CommandEmpty>No worker found.</CommandEmpty>
                                            ) : (
                                                <CommandGroup>
                                                    {getWorkerSearch(index).results.map((worker) => (
                                                        <CommandItem
                                                            key={worker.id}
                                                            value={String(worker.id)}
                                                            onSelect={() => {
                                                                updateMaterial(index, "worker_id", worker.id);
                                                                updateMaterial(index, "worker_name", worker.name);
                                                                setWorkerSearchOpen(prev => ({ ...prev, [index]: false }));
                                                                fetchSuggestions(worker.id);
                                                            }}
                                                        >
                                                            <CheckIcon className={`mr-2 h-4 w-4 ${m.worker_id === worker.id ? "opacity-100" : "opacity-0"}`} />
                                                            {worker.name} {worker.designation && <span className="text-muted-foreground ml-2">({worker.designation})</span>}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Suggestions Carousel */}
                        {m.worker_id && suggestions[m.worker_id] && suggestions[m.worker_id].length > 0 && (
                            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", scrollbarWidth: "none" }} className="no-scrollbar">
                                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>Suggestions:</span>
                                {suggestions[m.worker_id].map((suggestion, i) => (
                                    <Badge 
                                        key={i} 
                                        variant="secondary" 
                                        className="cursor-pointer whitespace-nowrap hover:bg-gray-200"
                                        onClick={() => updateMaterial(index, "name", suggestion)}
                                    >
                                        {suggestion}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center", flexWrap: "wrap" }}>
                            {expenseHeads.length > 0 ? (
                                <select
                                    className="input-field"
                                    style={{ flex: "1 1 200px", color: "#000", backgroundColor: "#fff", appearance: "none", cursor: "pointer" }}
                                    value={m.name}
                                    onChange={(e) => updateMaterial(index, "name", e.target.value)}
                                >
                                    <option value="" style={{ color: "#555" }}>Select Expense Head</option>
                                    {expenseHeads.map((head) => (
                                        <option key={head} value={head} style={{ color: "#000" }}>
                                            {head}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    placeholder="Expense Name"
                                    className="input-field"
                                    style={{ flex: "1 1 200px" }}
                                    value={m.name}
                                    onChange={(e) => updateMaterial(index, "name", e.target.value)}
                                />
                            )}
                            <input
                                type="number"
                                placeholder="Qty"
                                className="input-field"
                                style={{ flex: "1 1 80px" }}
                                value={m.quantity}
                                onChange={(e) => updateMaterial(index, "quantity", e.target.value)}
                            />
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Price"
                                className="input-field"
                                style={{ flex: "1 1 100px" }}
                                value={m.unit_price}
                                onChange={(e) => updateMaterial(index, "unit_price", e.target.value)}
                            />
                            {materials.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeMaterial(index)}
                                    style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "18px" }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Image Upload/Capture Section */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {m.image_url ? (
                                <div style={{ position: "relative", width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
                                    <img src={m.image_url} alt="Material" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button
                                        type="button"
                                        onClick={() => updateMaterial(index, "image_url", "")}
                                        style={{ position: "absolute", top: 2, right: 2, background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "10px", cursor: "pointer" }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        style={{ fontSize: "11px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "4px" }}
                                        onClick={() => {
                                            setActiveMaterialIndex(index);
                                            setShowCamera(true);
                                        }}
                                        disabled={uploadingMaterial === index}
                                    >
                                        📷 {uploadingMaterial === index ? "Uploading..." : "Capture Photo"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        style={{ fontSize: "11px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "4px" }}
                                        onClick={() => {
                                            setActiveMaterialIndex(index);
                                            materialFileInputRef.current?.click();
                                        }}
                                        disabled={uploadingMaterial === index}
                                    >
                                        📁 Upload File
                                    </button>
                                </div>
                            )}
                            {uploadingMaterial === index && <span className="spinner" style={{ width: "14px", height: "14px", borderTopColor: "var(--primary)" }}></span>}
                            {!m.image_url && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>* Photo of material/receipt is recommended</span>}
                        </div>

                        {/* Recurring Reminder Section */}
                        {m.worker_id && (
                            <div style={{ marginTop: "16px", padding: "12px", background: "rgba(59, 130, 246, 0.05)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>
                                    <input 
                                        type="checkbox" 
                                        checked={m.is_recurring} 
                                        onChange={(e) => updateMaterial(index, "is_recurring", e.target.checked)}
                                        style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
                                    />
                                    Make this a monthly recurring allowance
                                </label>
                                {m.is_recurring && (
                                    <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Generate request on day:</span>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            max="31" 
                                            className="input-field" 
                                            style={{ width: "60px", padding: "4px 8px" }}
                                            placeholder="DD"
                                            value={m.reminder_day}
                                            onChange={(e) => updateMaterial(index, "reminder_day", e.target.value)}
                                        />
                                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>of every month.</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                <input
                    type="file"
                    ref={materialFileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) => {
                        if (e.target.files?.[0]) {
                            handleMaterialImageUpload(activeMaterialIndex, e.target.files[0]);
                        }
                    }}
                />

                <button
                    type="button"
                    className="btn-ghost"
                    onClick={addMaterial}
                    style={{ width: "auto", fontSize: "12px" }}
                >
                    + Add More Expenses
                </button>
            </div>

            {/* --- General Bill Section --- */}
            {/* <div className="divider" style={{ margin: "24px 0", borderTop: "1px solid var(--border)" }} />
            
            <div style={{ marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px", color: "var(--text)" }}>Add General Bill / Invoice Image</h3>
                
                <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
                    <div style={{ flex: "2 1 200px" }}>
                        <label className="stat-label">Description / Bill Name</label>
                        <input 
                            type="text" 
                            className="input-field"
                            placeholder="e.g. Site B - Transport Bill"
                            value={billName}
                            onChange={(e) => setBillName(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: "1 1 100px" }}>
                        <label className="stat-label">Amount (Optional)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="input-field"
                            placeholder="₹"
                            value={billAmount}
                            onChange={(e) => setBillAmount(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                    <label className="stat-label">Bill / QR Image</label>
                    <div style={{ 
                        marginTop: "8px", 
                        border: "2px dashed var(--border)", 
                        borderRadius: "12px", 
                        padding: "24px", 
                        textAlign: "center",
                        background: "rgba(255,255,255,0.4)"
                    }}>
                        {billPreviewUrl ? (
                            <div style={{ position: "relative", width: "100%", maxWidth: "300px", margin: "0 auto" }}>
                                <Image 
                                    src={billPreviewUrl} 
                                    alt="Preview" 
                                    width={300} 
                                    height={200} 
                                    style={{ borderRadius: "10px", objectFit: "cover" }} 
                                />
                                <button 
                                    type="button"
                                    onClick={() => { setBillPreviewUrl(null); setBillUploadData({ url: "", fileId: "" }); }}
                                    style={{ 
                                        position: "absolute", 
                                        top: "-10px", 
                                        right: "-10px", 
                                        background: "var(--danger)", 
                                        color: "white", 
                                        border: "none", 
                                        borderRadius: "50%", 
                                        width: "24px", 
                                        height: "24px", 
                                        cursor: "pointer",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <div style={{ position: "relative" }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleBillImageUpload}
                                    style={{ display: "none" }}
                                    id="bill-upload"
                                    disabled={isUploadingBill}
                                />
                                <label htmlFor="bill-upload" className="btn-ghost" style={{ 
                                    cursor: isUploadingBill ? "not-allowed" : "pointer", 
                                    display: "inline-flex", 
                                    alignItems: "center", 
                                    gap: "8px",
                                    padding: "12px 24px",
                                    opacity: isUploadingBill ? 0.6 : 1
                                }}>
                                    {isUploadingBill ? "⌛ Uploading..." : "📷 Choose Image / Take Photo"}
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div> */}

            {showCamera && (
                <CameraCapture
                    onCapture={(dataUrl) => handleMaterialImageUpload(activeMaterialIndex, dataUrl)}
                    onClose={() => {
                        setShowCamera(false);
                        setActiveMaterialIndex(null);
                    }}
                />
            )}

            <div className="divider" style={{ margin: "24px 0", borderTop: "1px solid var(--border)" }} />

            {/* --- Footer & Submit --- */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                    <span className="stat-label">Total Material Amount</span>
                    <div className="stat-value" style={{ fontSize: "24px", color: "var(--accent)" }}>
                        ₹{totalAmount.toLocaleString()}
                    </div>
                </div>
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: "auto", minWidth: "200px" }}
                    disabled={loading || isUploadingBill || uploadingMaterial !== null}
                >
                    {loading ? <span className="spinner"></span> : "Submit Request"}
                </button>
            </div>
        </form>
    );
}
