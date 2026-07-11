import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || (!hasRole(user, "PROJECT_MANAGER") && !hasRole(user, "SUPERVISOR"))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, image_url, image_file_id, project_id, amount } = await req.json();

        if (!name || !project_id) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const bill = await prisma.bill.create({
            data: {
                name,
                image_url,
                image_file_id,
                amount: amount ? parseFloat(amount) : null,
                project_id: parseInt(project_id),
                creator_id: user.id
            }
        });

        return NextResponse.json(bill);
    } catch (error) {
        console.error("POST bill error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || (!hasRole(user, "PROJECT_MANAGER") && !hasRole(user, "SUPER_ADMIN") && !hasRole(user, "SUPERVISOR"))) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("project_id");

        const where = {};
        if (projectId && projectId !== "all") {
            where.project_id = parseInt(projectId);
        }

        // Supervisor only sees bills NOT created by Project Manager
        if (hasRole(user, "SUPERVISOR")) {
            where.creator = {
                role: { notIn: ["PROJECT_MANAGER"] }
            };
        }

        const bills = await prisma.bill.findMany({
            where,
            include: {
                project: { select: { name: true } },
                creator: { select: { name: true } }
            },
            orderBy: { created_at: "desc" }
        });

        return NextResponse.json(bills);
    } catch (error) {
        console.error("GET bills error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
