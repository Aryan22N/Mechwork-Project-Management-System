import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        // Vercel Cron verification (optional, depending on your setup)
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();
        const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

        // Find sessions older than 12 hours that haven't been checked out
        const expiredSessions = await prisma.attendance.findMany({
            where: {
                status: "CHECKED_IN",
                checkOutTime: null,
                checkInTime: {
                    lte: twelveHoursAgo
                }
            }
        });

        let updatedCount = 0;

        for (const session of expiredSessions) {
            const checkInTime = new Date(session.checkInTime);
            // Assuming they worked 12 hours or just calculate it
            const durationMinutes = Math.floor((now - checkInTime) / (1000 * 60));

            await prisma.attendance.update({
                where: { id: session.id },
                data: {
                    status: "AUTO_CHECKOUT",
                    checkOutTime: now,
                    durationMinutes,
                    // Leaving checkOutLatitude/Longitude null as we don't know where they are
                }
            });
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Processed auto-checkout for ${updatedCount} sessions.`,
            updatedCount
        });

    } catch (error) {
        console.error("Auto-checkout cron error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
