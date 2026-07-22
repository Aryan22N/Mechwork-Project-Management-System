import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const user = await getUser();
        if (!user || (user.role !== "SUPERVISOR" && user.role !== "PROJECT_MANAGER")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find active attendance session
        const activeSession = await prisma.attendance.findFirst({
            where: {
                userId: user.id,
                status: "CHECKED_IN"
            },
            include: { site: true },
            orderBy: { checkInTime: "desc" }
        });

        if (!activeSession) {
            // Check if they completed today (boundary 3:00 AM)
            const now = new Date();
            const startOfDay = new Date(now);
            if (startOfDay.getHours() < 3) {
                // If it's before 3 AM, the "day" started yesterday at 3 AM
                startOfDay.setDate(startOfDay.getDate() - 1);
            }
            startOfDay.setHours(3, 0, 0, 0);

            const completedSession = await prisma.attendance.findFirst({
                where: {
                    userId: user.id,
                    status: { in: ["CHECKED_OUT", "AUTO_CHECKOUT"] },
                    checkOutTime: { gte: startOfDay }
                }
            });

            if (completedSession) {
                return NextResponse.json({
                    checkedIn: false,
                    canCheckIn: false,
                    canCheckout: false,
                    completedToday: true,
                    remainingSeconds: 0,
                    activeSite: null
                });
            }

            return NextResponse.json({
                checkedIn: false,
                canCheckIn: true,
                canCheckout: false,
                completedToday: false,
                remainingSeconds: 0,
                activeSite: null
            });
        }

        // Calculate remaining seconds for 7-hour shift requirement
        const MIN_WORKING_MINUTES = 420;
        const MIN_WORKING_SECONDS = MIN_WORKING_MINUTES * 60;
        
        const now = new Date();
        const checkInTime = new Date(activeSession.checkInTime);
        const workedSeconds = Math.floor((now - checkInTime) / 1000);
        const remainingSeconds = Math.max(0, MIN_WORKING_SECONDS - workedSeconds);

        return NextResponse.json({
            checkedIn: true,
            canCheckIn: false,
            canCheckout: remainingSeconds === 0,
            completedToday: false,
            remainingSeconds,
            activeSite: activeSession.site ? { id: activeSession.site.id, name: activeSession.site.name } : null
        });

    } catch (error) {
        console.error("Attendance status error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
