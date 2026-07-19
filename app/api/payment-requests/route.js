import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Rebuild after cache clear

// GET: Fetch requests based on role
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit');
        // Default to a sane limit to prevent system from hanging if there are thousands of records
        const limit = limitParam ? parseInt(limitParam) : 100;
        const statusParam = searchParams.get('status');
        const projectParam = searchParams.get('project');
        const ownParam = searchParams.get('own');

        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let requests;

        if (hasRole(user, "SUPERVISOR")) {
            requests = await prisma.paymentRequest.findMany({
                where: { supervisor_id: user.id },
                include: { project: true, materials: true },
                orderBy: { created_at: "desc" },
                take: limit
            });
        } else if (hasRole(user, "PROJECT_MANAGER")) {
            if (ownParam === 'true') {
                const pmWhere = { supervisor_id: user.id };
                if (statusParam && statusParam !== "ALL") {
                    pmWhere.status = statusParam;
                }
                if (projectParam) pmWhere.project_id = parseInt(projectParam);

                requests = await prisma.paymentRequest.findMany({
                    where: pmWhere,
                    include: { 
                        project: true, 
                        materials: true, 
                        supervisor: { select: { name: true } }
                    },
                    orderBy: { created_at: "desc" },
                    take: limit
                });
            } else {
                const pmWhere = {
                    project: { managers: { some: { id: user.id } } }
                };
            if (statusParam && statusParam !== "ALL") {
                pmWhere.status = statusParam;
            } else if (!statusParam) {
                pmWhere.status = "PENDING_PM";
            }
            if (projectParam) pmWhere.project_id = parseInt(projectParam);

            requests = await prisma.paymentRequest.findMany({
                where: pmWhere,
                include: { 
                    project: true, 
                    materials: true, 
                    supervisor: { select: { name: true } }
                },
                orderBy: { created_at: "desc" },
                take: limit
            });

            // Project-wise clubbing for Manager
            const clubbedMap = {};
            for (const req of requests) {
                const clubKey = `${req.project_id}-${req.status}-PM_GROUP`;
                if (!clubbedMap[clubKey]) {
                    clubbedMap[clubKey] = {
                        ...req,
                        isClubbed: true,
                        requestIds: [req.id],
                        _materials: [...req.materials],
                        _total_amount: parseFloat(req.total_amount),
                        _supervisor_names: [req.supervisor?.name || "Self"],
                        subRequests: [req]
                    };
                } else {
                    clubbedMap[clubKey].requestIds.push(req.id);
                    clubbedMap[clubKey]._materials.push(...req.materials);
                    clubbedMap[clubKey]._total_amount += parseFloat(req.total_amount);
                    if (req.supervisor?.name && !clubbedMap[clubKey]._supervisor_names.includes(req.supervisor.name)) {
                        clubbedMap[clubKey]._supervisor_names.push(req.supervisor.name);
                    }
                    clubbedMap[clubKey].subRequests.push(req);
                }
            }

            requests = Object.values(clubbedMap).map(c => ({
                ...c,
                materials: c._materials,
                total_amount: c._total_amount,
                supervisor: { name: c._supervisor_names.join(", ") }
            }));
            
                requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
        } else if (hasRole(user, "SUPER_ADMIN")) {
            const adminWhere = {};
            if (statusParam && statusParam !== "ALL") adminWhere.status = statusParam;
            if (projectParam) adminWhere.project_id = parseInt(projectParam);

            requests = await prisma.paymentRequest.findMany({
                where: adminWhere,
                include: { 
                    project: true, 
                    materials: true, 
                    supervisor: { select: { name: true } },
                    pm: { select: { name: true } }
                },
                orderBy: { created_at: "desc" },
                take: limit
            });

            // Day-wise clubbing for Super Admin
            const clubbedMap = {};
            
            for (const req of requests) {
                const dateKey = new Date(req.created_at).toLocaleDateString("en-IN");
                const clubKey = `${req.project_id}-${dateKey}-${req.status}`;
                
                if (!clubbedMap[clubKey]) {
                    clubbedMap[clubKey] = {
                        ...req,
                        isClubbed: true,
                        requestIds: [req.id],
                        _materials: [...req.materials],
                        _total_amount: parseFloat(req.total_amount),
                        _supervisor_names: [req.supervisor?.name || "Self"]
                    };
                } else {
                    clubbedMap[clubKey].requestIds.push(req.id);
                    clubbedMap[clubKey]._materials.push(...req.materials);
                    clubbedMap[clubKey]._total_amount += parseFloat(req.total_amount);
                    if (req.supervisor?.name && !clubbedMap[clubKey]._supervisor_names.includes(req.supervisor.name)) {
                        clubbedMap[clubKey]._supervisor_names.push(req.supervisor.name);
                    }
                }
            }
            
            // Map back to array structure expected by frontend
            requests = Object.values(clubbedMap).map(c => ({
                ...c,
                materials: c._materials,
                total_amount: c._total_amount,
                supervisor: { name: c._supervisor_names.join(", ") }
            }));
            
            // Re-sort by date
            requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Attach latest progress for each project (for PM and Super Admin)
        if (hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            const projectIds = [...new Set(requests.map(r => r.project_id))];
            const progressMap = {};
            
            if (projectIds.length > 0) {
                const allProgresses = await prisma.projectProgress.findMany({
                    where: { project_id: { in: projectIds } },
                    orderBy: { created_at: "desc" },
                    include: { user: { select: { name: true, role: true } } }
                });

                for (const pid of projectIds) {
                    const latest = allProgresses.filter(p => p.project_id === pid).slice(0, 5);
                    if (latest.length > 0) {
                        const maxPct = Math.max(...latest.map(p => p.percentage));
                        progressMap[pid] = { 
                            percentage: maxPct, 
                            notes: latest.map(n => ({
                                percentage: n.percentage,
                                date: n.date,
                                notes: n.notes,
                                user: n.user
                            }))
                        };
                    } else {
                        progressMap[pid] = { percentage: 0, notes: [] };
                    }
                }
            }

            // Attach progress to each request
            requests = requests.map(r => ({
                ...r,
                progress: progressMap[r.project_id] || null
            }));
        }

        return NextResponse.json(requests);
    } catch (error) {
        console.error("GET payment requests error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// POST: Create a new request (Supervisor only)
// Merges with existing same-day, same-project PENDING_PM request if one exists
export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPERVISOR", "PROJECT_MANAGER"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { project_id, materials, total_amount } = body;

        if (!project_id || !materials || !materials.length) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const parsedProjectId = parseInt(project_id);

        // Check for existing same-day PENDING_PM request for this project by this supervisor
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const isManager = hasRole(user, "PROJECT_MANAGER");
        const targetStatus = isManager ? "PENDING_ADMIN" : "PENDING_PM";

        const existingRequest = await prisma.paymentRequest.findFirst({
            where: {
                project_id: parsedProjectId,
                supervisor_id: user.id,
                status: targetStatus,
                created_at: {
                    gte: todayStart,
                    lte: todayEnd
                }
            },
            include: { materials: true }
        });

        if (existingRequest) {
            // Merge: add new materials to the existing request
            const newMaterials = materials.map(m => ({
                name: m.name,
                quantity: parseInt(m.quantity),
                unit_price: parseFloat(m.unit_price),
                image_url: m.image_url || null,
                image_file_id: m.image_file_id || null,
                request_id: existingRequest.id,
                worker_id: m.worker_id ? parseInt(m.worker_id) : null
            }));

            await prisma.material.createMany({
                data: newMaterials
            });

            // Update total amount
            const newTotal = parseFloat(existingRequest.total_amount) + parseFloat(total_amount);
            const updatedRequest = await prisma.paymentRequest.update({
                where: { id: existingRequest.id },
                data: { total_amount: newTotal },
                include: { materials: true }
            });

            return NextResponse.json(updatedRequest, { status: 200 });
        }

        // No existing request — create new
        const newRequest = await prisma.paymentRequest.create({
            data: {
                project_id: parsedProjectId,
                supervisor_id: user.id,
                pm_id: isManager ? user.id : null,
                total_amount: parseFloat(total_amount),
                status: targetStatus,
                materials: {
                    create: materials.map(m => ({
                        name: m.name,
                        quantity: parseInt(m.quantity),
                        unit_price: parseFloat(m.unit_price),
                        image_url: m.image_url || null,
                        image_file_id: m.image_file_id || null,
                        worker_id: m.worker_id ? parseInt(m.worker_id) : null
                    }))
                }
            },
            include: { materials: true }
        });

        return NextResponse.json(newRequest, { status: 201 });
    } catch (error) {
        console.error("POST payment request error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
