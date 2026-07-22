import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["SUPER_ADMIN", "PROJECT_MANAGER"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        const whereClause = { status: "ACTIVE" };
        if (projectId) whereClause.id = parseInt(projectId, 10);
        if (user.role === "PROJECT_MANAGER") {
            whereClause.managers = { some: { id: user.id } };
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: {
                requests: {
                    where: { status: "PAID" },
                    select: { total_amount: true }
                }
            }
        });

        let totalAllocated = 0;
        let totalUtilized = 0;

        const chartData = projects.map(p => {
            const budget = p.budget ? Number(p.budget) : 0;
            const spent = p.requests.reduce((sum, req) => sum + Number(req.total_amount), 0);
            
            totalAllocated += budget;
            totalUtilized += spent;

            return {
                name: p.name,
                budget,
                spent
            };
        });

        // Sort by whichever is higher — budget or spent — so projects with budget but no spending still show
        chartData.sort((a, b) => Math.max(b.budget, b.spent) - Math.max(a.budget, a.spent));
        const topChartData = chartData.slice(0, 5);

        return NextResponse.json({
            totalAllocated,
            totalUtilized,
            chartData: topChartData
        });
    } catch (error) {
        console.error("GET analytics error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
