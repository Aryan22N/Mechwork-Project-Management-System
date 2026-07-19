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

        if (accuracy > 20) {
            return NextResponse.json({
                success: false,
                message: "GPS accuracy too low. Please move to an open area."
            }, { status: 400 });
        }

        const sites = await prisma.site.findMany({
            where: { status: "ACTIVE" }
        });

        let matchedSite = null;

        for (const site of sites) {
            const distance = calculateDistance(site.latitude, site.longitude, latitude, longitude);
            if (distance <= site.radius) {
                matchedSite = site;
                break;
            }
        }

        if (matchedSite) {
            return NextResponse.json({ success: true, site: { id: matchedSite.id, name: matchedSite.name } });
        } else {
            return NextResponse.json({ success: false, message: "You are not within the geofence of any active site." });
        }

    } catch (error) {
        console.error("Verify location error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
