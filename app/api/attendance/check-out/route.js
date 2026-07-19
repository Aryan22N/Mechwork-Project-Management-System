import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { calculateDistance } from "@/lib/geolocation";

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== "SUPERVISOR") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { latitude, longitude, accuracy } = body;

        if (!latitude || !longitude || accuracy == null) {
            return NextResponse.json({ success: false, message: "Missing location data" }, { status: 400 });
        }

        // GPS Accuracy Validation
        if (accuracy > 300) {
            console.log(`[Check-out Failed] GPS accuracy too low: ${Math.round(accuracy)}m (Max allowed: 300m)`);
            return NextResponse.json({
                success: false,
                message: `GPS accuracy too low (${Math.round(accuracy)}m). Please move to an open area.`
            }, { status: 400 });
        }

        // Find Active Attendance
        const activeSession = await prisma.attendance.findFirst({
            where: {
                userId: user.id,
                status: "CHECKED_IN"
            },
            include: { site: true }
        });

        if (!activeSession) {
            return NextResponse.json({ success: false, message: "No active check-in found." }, { status: 400 });
        }

        // Calculate Server Time - CheckIn
        const MIN_WORKING_MINUTES = 1; // Testing value
        const MIN_WORKING_MS = MIN_WORKING_MINUTES * 60 * 1000;
        const now = new Date();
        const checkInTime = new Date(activeSession.checkInTime);
        const workedMs = now - checkInTime;

        if (workedMs < MIN_WORKING_MS) {
            return NextResponse.json({
                success: false,
                message: "Minimum working duration of 1 minute not completed."
            }, { status: 400 });
        }

        // Calculate Distance
        const site = activeSession.site;
        const distance = calculateDistance(site.latitude, site.longitude, latitude, longitude);

        if (distance > site.radius) {
            return NextResponse.json({
                success: false,
                message: `You are too far from the checkout location. Distance: ${Math.round(distance)}m, Allowed: ${site.radius}m`
            }, { status: 400 });
        }

        const durationMinutes = Math.floor(workedMs / (1000 * 60));

        // Update Attendance
        await prisma.attendance.update({
            where: { id: activeSession.id },
            data: {
                checkOutLatitude: latitude,
                checkOutLongitude: longitude,
                checkOutAccuracy: accuracy,
                checkOutTime: now,
                durationMinutes,
                status: "CHECKED_OUT"
            }
        });

        return NextResponse.json({ success: true, message: "Checked out successfully." });

    } catch (error) {
        console.error("Check-out error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
