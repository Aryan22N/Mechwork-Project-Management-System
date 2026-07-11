import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const workerId = searchParams.get("worker_id");

        if (!workerId) {
            return NextResponse.json({ error: "worker_id is required" }, { status: 400 });
        }

        const reminders = await prisma.reminder.findMany({
            where: {
                worker_id: parseInt(workerId)
            },
            include: {
                project: { select: { id: true, name: true } }
            },
            orderBy: { created_at: "desc" }
        });

        return NextResponse.json(reminders);
    } catch (error) {
        console.error("GET reminders error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN", "SUPERVISOR"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { worker_id, project_id, amount, day_of_month, reason } = body;

        if (!worker_id || !project_id || !amount || !day_of_month || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const reminder = await prisma.reminder.create({
            data: {
                worker_id: parseInt(worker_id),
                project_id: parseInt(project_id),
                amount: parseFloat(amount),
                day_of_month: parseInt(day_of_month),
                reason,
                frequency: "MONTHLY",
                is_active: true
            }
        });

        return NextResponse.json(reminder, { status: 201 });
    } catch (error) {
        console.error("POST reminder error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
