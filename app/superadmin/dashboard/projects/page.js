"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import ProjectCreationModal from "@/components/ProjectCreationModal";
import ProjectEditModal from "@/components/ProjectEditModal";
import ShimmerLoader from "@/components/ShimmerLoader";

export default function SuperAdminProjectsPage() {
    const router = useRouter();
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState(null);

    const fetchProjects = () => {
        fetch("/api/projects")
            .then(res => res.json())
            .then(data => {
                setProjects(data);
            })
            .catch(err => console.error(err));
    };

    useEffect(() => {
        setIsLoading(true);
        fetchProjects();
        setTimeout(() => setIsLoading(false), 600);
    }, []);

    const handleProjectCreated = () => {
        fetchProjects();
    };

    const handleProjectUpdated = () => {
        fetchProjects();
    };

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
                    <button
                        className="btn-primary"
                        style={{ padding: "8px 18px", fontSize: "13px", width: "auto", display: "inline-flex", alignItems: "center", height: "36px" }}
                        onClick={() => setIsProjectModalOpen(true)}
                    >
                        + New Project
                    </button>
                    <span className="role-badge role-super">⚡ Super Admin</span>
                    <button className="btn-ghost" onClick={() => router.push("/superadmin/dashboard")}>Back to Dashboard</button>
                </div>
            </header>

            <main className="page-content" style={{ position: "relative", zIndex: 10 }}>
                <Link href="/superadmin/dashboard" style={{ display: "inline-block", marginBottom: "24px", color: "var(--primary)", textDecoration: "none", fontWeight: "600" }}>
                    ← Back to Dashboard
                </Link>

                {isLoading ? (
                    <ShimmerLoader />
                ) : (
                    <div className="fade-up" style={{ marginBottom: "36px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                            <h2 className="section-title" style={{ margin: 0 }}>Manage Projects</h2>
                            <button
                                className="btn-primary mobile-only-btn"
                                style={{ padding: "6px 14px", fontSize: "12px", width: "auto" }}
                                onClick={() => setIsProjectModalOpen(true)}
                            >
                                + New Project
                            </button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                            {projects.map(project => (
                                <div key={project.id} className="glass-card" style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{project.name}</div>
                                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                                            {project.expense_heads?.length || 0} Heads • <span style={{ color: project.status === "ACTIVE" ? "var(--success)" : "var(--text-muted)" }}>{project.status}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button 
                                            className="btn-ghost" 
                                            onClick={() => {
                                                setProjectToEdit(project);
                                                setIsEditModalOpen(true);
                                            }}
                                            style={{ padding: "6px 14px", fontSize: "12px", borderRadius: "8px" }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            className={project.status === "ACTIVE" ? "btn-primary" : "btn-ghost"}
                                            style={{ 
                                                height: "36px", width: "auto", padding: "0 12px", fontSize: "12px", borderRadius: "8px",
                                                background: project.status === "ACTIVE" ? "var(--success)" : "rgba(59,130,246,0.1)", 
                                                borderColor: project.status === "ACTIVE" ? "var(--success)" : "rgba(59,130,246,0.2)",
                                                color: project.status === "ACTIVE" ? "#fff" : "var(--primary)"
                                            }}
                                            onClick={async () => {
                                                const isFinish = project.status === "ACTIVE";
                                                const action = isFinish ? "finish" : "unarchive";
                                                if (confirm(`Are you sure you want to ${isFinish ? "finish" : "unarchive"} this project? ${isFinish ? "All current notes will be archived." : ""}`)) {
                                                    try {
                                                        const res = await fetch(`/api/projects/${project.id}/${action}`, { method: "POST" });
                                                        if (res.ok) {
                                                            alert(`Project ${isFinish ? "finished" : "unarchived"} successfully!`);
                                                            fetchProjects();
                                                        } else {
                                                            const data = await res.json();
                                                            alert(data.error || `Failed to ${action} project`);
                                                        }
                                                    } catch (err) {
                                                        alert("An error occurred");
                                                    }
                                                }
                                            }}
                                        >
                                            {project.status === "ACTIVE" ? "✓ Finish" : "↺ Unarchive"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            <ProjectCreationModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onProjectCreated={handleProjectCreated}
            />
            <ProjectEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                project={projectToEdit}
                onProjectUpdated={handleProjectUpdated}
            />
        </div>
    );
}
