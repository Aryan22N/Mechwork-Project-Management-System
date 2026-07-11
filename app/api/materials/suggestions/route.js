import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN", "SUPERVISOR"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const workerId = searchParams.get("worker_id");

        if (!workerId) {
            return NextResponse.json([]);
        }

        // Group by name for the specific worker to find most frequent expense names
        const suggestions = await prisma.material.groupBy({
            by: ['name'],
            where: {
                worker_id: parseInt(workerId)
            },
            _count: {
                name: true
            },
            orderBy: {
                _count: {
                    name: 'desc'
                }
            },
            take: 5
        });

        return NextResponse.json(suggestions.map(s => s.name));
    } catch (error) {
        console.error("GET material suggestions error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
