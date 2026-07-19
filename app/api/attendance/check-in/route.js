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
        const { latitude, longitude, accuracy, siteId } = body;

        if (!latitude || !longitude || accuracy == null || !siteId) {
            return NextResponse.json({ success: false, message: "Missing location or site data" }, { status: 400 });
        }

        // GPS Accuracy Validation
        if (accuracy > 300) {
            console.log(`[Check-in Failed] GPS accuracy too low: ${Math.round(accuracy)}m (Max allowed: 300m)`);
            return NextResponse.json({
                success: false,
                message: `GPS accuracy too low (${Math.round(accuracy)}m). Please move to an open area.`
            }, { status: 400 });
        }

        // Check if already checked in
        const existingSession = await prisma.attendance.findFirst({
            where: {
                userId: user.id,
                status: "CHECKED_IN"
            }
        });

        if (existingSession) {
            console.log(`[Check-in Failed] User ${user.id} already checked in.`);
            return NextResponse.json({ success: false, message: "Already checked in." }, { status: 400 });
        }

        // Fetch the selected site
        const site = await prisma.site.findUnique({
            where: { id: siteId }
        });

        if (!site || site.status !== "ACTIVE") {
            console.log(`[Check-in Failed] Site ${siteId} is invalid or inactive.`);
            return NextResponse.json({ success: false, message: "Selected site is invalid or inactive." }, { status: 400 });
        }

        const distance = calculateDistance(site.latitude, site.longitude, latitude, longitude);
        
        if (distance > site.radius) {
            console.log(`[Check-in Failed] Distance too far. User at ${latitude},${longitude}. Site at ${site.latitude},${site.longitude}. Distance: ${Math.round(distance)}m, Allowed: ${site.radius}m`);
            return NextResponse.json({
                success: false,
                message: `You are too far from the selected project location. Distance: ${Math.round(distance)}m, Allowed: ${site.radius}m`
            }, { status: 400 });
        }

        // Insert Attendance Session using Prisma's default(now()) which uses CURRENT_TIMESTAMP
        await prisma.attendance.create({
            data: {
                userId: user.id,
                siteId: site.id,
                checkInLatitude: latitude,
                checkInLongitude: longitude,
                checkInAccuracy: accuracy,
                status: "CHECKED_IN"
                // checkInTime is automatically set to CURRENT_TIMESTAMP by DB
            }
        });

        return NextResponse.json({ success: true, message: "Checked in successfully." });

    } catch (error) {
        console.error("Check-in error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
