import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET: Fetch a single payment request for editing
export async function GET(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPERVISOR", "PROJECT_MANAGER"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const requestId = parseInt(id);

        const request = await prisma.paymentRequest.findUnique({
            where: { id: requestId },
            include: { materials: true }
        });

        if (!request) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        // Only the creator can view for editing
        if (request.supervisor_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(request);
    } catch (error) {
        console.error("GET payment request error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// PATCH: Update an existing payment request and its materials
export async function PATCH(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPERVISOR", "PROJECT_MANAGER"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const requestId = parseInt(id);
        const body = await req.json();
        const { project_id, materials, total_amount } = body;

        // Verify ownership
        const existingRequest = await prisma.paymentRequest.findUnique({
            where: { id: requestId }
        });

        if (!existingRequest) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (existingRequest.supervisor_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized: You can only edit your own requests" }, { status: 401 });
        }

        if (existingRequest.status !== "PENDING_PM" && existingRequest.status !== "PENDING_ADMIN") {
            return NextResponse.json({ error: "Cannot edit processed requests" }, { status: 400 });
        }

        // Run as transaction: delete old materials and create new ones
        const updatedRequest = await prisma.$transaction(async (tx) => {
            await tx.material.deleteMany({
                where: { request_id: requestId }
            });

            const updatedReq = await tx.paymentRequest.update({
                where: { id: requestId },
                data: {
                    project_id: parseInt(project_id),
                    total_amount: parseFloat(total_amount),
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

            return updatedReq;
        });

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("PATCH payment request error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE: Delete a payment request and its materials (Supervisor only if PENDING_PM, Manager if PENDING_ADMIN)
export async function DELETE(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPERVISOR", "PROJECT_MANAGER"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const requestId = parseInt(id);

        // Verify ownership and status
        const existingRequest = await prisma.paymentRequest.findUnique({
            where: { id: requestId }
        });

        if (!existingRequest) {
            return NextResponse.json({ error: "Request not found" }, { status: 404 });
        }

        if (existingRequest.supervisor_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (existingRequest.status !== "PENDING_PM" && existingRequest.status !== "PENDING_ADMIN") {
            return NextResponse.json({ error: "Can only delete pending requests" }, { status: 400 });
        }

        // Delete associated materials first
        await prisma.material.deleteMany({
            where: { request_id: requestId }
        });

        // Delete the request
        await prisma.paymentRequest.delete({
            where: { id: requestId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE payment request error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
