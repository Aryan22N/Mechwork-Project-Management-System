import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, phone, address, designation, joining_date, status, notes } = body;

        const updatedWorker = await prisma.worker.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(phone !== undefined && { phone }),
                ...(address !== undefined && { address }),
                ...(designation !== undefined && { designation }),
                ...(joining_date !== undefined && { joining_date: joining_date ? new Date(joining_date) : null }),
                ...(status && { status }),
                ...(notes !== undefined && { notes }),
            }
        });

        return NextResponse.json(updatedWorker);
    } catch (error) {
        console.error("PATCH worker error:", error);
        return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const worker = await prisma.worker.findUnique({
            where: { id: parseInt(id) },
            include: {
                materials: {
                    include: { request: { include: { project: true } } },
                    orderBy: { request: { created_at: 'desc' } }
                },
                reminders: {
                    where: { is_active: true },
                    include: { project: { select: { id: true, name: true } } },
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!worker) {
            return NextResponse.json({ error: "Worker not found" }, { status: 404 });
        }

        return NextResponse.json(worker);
    } catch (error) {
        console.error("GET worker error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        
        await prisma.worker.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE worker error:", error);
        return NextResponse.json({ error: "Failed to delete worker or worker is in use" }, { status: 500 });
    }
}
