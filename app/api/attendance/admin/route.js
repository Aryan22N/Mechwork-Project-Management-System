import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // 1-12
        const year = searchParams.get("year");   // e.g. 2026
        const siteId = searchParams.get("siteId");

        let whereClause = {};

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
            
            whereClause.checkInTime = {
                gte: startDate,
                lte: endDate
            };
        }

        if (siteId && siteId !== "all") {
            whereClause.siteId = siteId;
        }

        const attendances = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                user: {
                    select: { id: true, name: true, phone: true }
                },
                site: {
                    select: { id: true, name: true }
                }
            },
            orderBy: { checkInTime: "desc" }
        });

        // Group data by supervisor for summary
        const summaryMap = {};

        attendances.forEach(record => {
            if (!record.user) return; // safeguard

            const userId = record.user.id;
            if (!summaryMap[userId]) {
                summaryMap[userId] = {
                    user: record.user,
                    daysPresent: 0,
                    daysWorked: 0,
                    history: []
                };
            }

            // A single record is counted as 1 day present
            summaryMap[userId].daysPresent += 1;
            
            // If they successfully checked out (or auto-checkout implies completion)
            if (record.status === "CHECKED_OUT" || record.status === "AUTO_CHECKOUT") {
                summaryMap[userId].daysWorked += 1;
            }

            summaryMap[userId].history.push(record);
        });

        const summary = Object.values(summaryMap);

        return NextResponse.json({
            rawRecords: attendances,
            summary
        });

    } catch (error) {
        console.error("Superadmin attendance GET error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
