import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// PATCH: Update an existing progress update (PM and Supervisor)
export async function PATCH(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPER_ADMIN", "PROJECT_MANAGER", "SUPERVISOR"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: paramId } = await params;
        const id = parseInt(paramId);
        const body = await req.json();
        const { percentage, date, notes } = body;

        const updatedUpdate = await prisma.projectProgress.update({
            where: { id },
            data: {
                percentage: percentage !== undefined ? parseInt(percentage) : undefined,
                date: date || undefined,
                notes: notes !== undefined ? notes : undefined
            }
        });

        return NextResponse.json(updatedUpdate);
    } catch (error) {
        console.error("PATCH progress error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

// DELETE: Delete an existing progress update (PM and Supervisor)
export async function DELETE(req, { params }) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPER_ADMIN", "PROJECT_MANAGER", "SUPERVISOR"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: paramId } = await params;
        const id = parseInt(paramId);

        await prisma.projectProgress.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE progress error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
