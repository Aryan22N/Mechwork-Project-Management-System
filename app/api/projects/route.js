import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const projects = await prisma.project.findMany({
            where: status ? { status } : {},
            orderBy: { created_at: "desc" }
        });

        return NextResponse.json(projects);
    } catch (error) {
        console.error("GET projects error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, expense_heads, budget } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        const project = await prisma.project.create({
            data: {
                name,
                description: description || "",
                expense_heads: Array.isArray(expense_heads) ? expense_heads : [],
                budget: budget ? parseFloat(budget) : null,
            },
        });

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Project creation error:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
