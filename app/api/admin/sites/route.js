import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";

export async function GET() {
    try {
        const user = await getUser();
        // Allow SUPERADMIN and ADMIN roles
        if (!user || (!hasRole(user, "SUPERADMIN") && !hasRole(user, "ADMIN"))) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const sites = await prisma.site.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                creator: {
                    select: { name: true }
                }
            }
        });

        return NextResponse.json({ success: true, sites });
    } catch (error) {
        console.error("Fetch sites error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || (!hasRole(user, "SUPERADMIN") && !hasRole(user, "ADMIN"))) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, latitude, longitude, radius, status } = body;

        if (!name || latitude == null || longitude == null) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const site = await prisma.site.create({
            data: {
                name,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: radius ? parseFloat(radius) : 30, // Default to 30m
                status: status || "ACTIVE",
                createdBy: user.id
            }
        });

        return NextResponse.json({ success: true, site });
    } catch (error) {
        console.error("Create site error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}
