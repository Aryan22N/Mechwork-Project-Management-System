import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== "SUPERVISOR" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sites = await prisma.site.findMany({
            where: { status: "ACTIVE" },
            select: { id: true, name: true },
            orderBy: { name: "asc" }
        });

        return NextResponse.json(sites);
    } catch (error) {
        console.error("Fetch sites error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
