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
        const q = searchParams.get("q");

        if (!q || q.length < 2) {
            return NextResponse.json([]);
        }

        const workers = await prisma.worker.findMany({
            where: {
                name: {
                    contains: q,
                    mode: "insensitive"
                },
                status: "ACTIVE"
            },
            select: {
                id: true,
                name: true,
                designation: true
            },
            take: 10
        });

        return NextResponse.json(workers);
    } catch (error) {
        console.error("GET workers search error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
