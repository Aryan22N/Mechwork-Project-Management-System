import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectName = searchParams.get("projectName");

        if (!projectName || projectName.trim().length === 0) {
            return NextResponse.json([]);
        }

        const recentProjects = await prisma.project.findMany({
            where: {
                name: {
                    equals: projectName.trim(),
                    mode: "insensitive"
                }
            },
            orderBy: { created_at: "desc" },
            take: 5,
            include: {
                managers: { select: { id: true, name: true, phone: true } }
            }
        });

        // Extract unique managers
        const suggestedManagersMap = new Map();
        for (const proj of recentProjects) {
            for (const manager of proj.managers) {
                if (!suggestedManagersMap.has(manager.id)) {
                    suggestedManagersMap.set(manager.id, manager);
                }
            }
        }

        return NextResponse.json(Array.from(suggestedManagersMap.values()));
    } catch (error) {
        console.error("GET manager suggestions error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
