import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
    try {
        const user = await getUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, description, expense_heads, status, budget, manager_ids, latitude, longitude, radius } = body;

        const updatedProject = await prisma.project.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(expense_heads && { expense_heads: Array.isArray(expense_heads) ? expense_heads : [] }),
                ...(status && { status }),
                ...(budget !== undefined && { budget: budget ? parseFloat(budget) : null }),
                ...(manager_ids !== undefined && Array.isArray(manager_ids) && { 
                    managers: { set: manager_ids.map(mId => ({ id: parseInt(mId) })) }
                }),
            },
            include: { managers: { select: { id: true, name: true, phone: true } } }
        });

        // Handle Site update/creation if coordinates are provided
        if (latitude != null && longitude != null) {
            const siteName = `${updatedProject.name} - Site`;
            const existingSite = await prisma.site.findFirst({
                where: { name: siteName }
            });

            console.log(`[Project PATCH] Received coordinates for ${siteName}: ${latitude}, ${longitude}`);

            if (existingSite) {
                console.log(`[Project PATCH] Updating existing site ID: ${existingSite.id}`);
                await prisma.site.update({
                    where: { id: existingSite.id },
                    data: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        ...(radius != null && { radius: parseFloat(radius) })
                    }
                });
            } else {
                console.log(`[Project PATCH] Creating NEW site for ${siteName}`);
                await prisma.site.create({
                    data: {
                        name: siteName,
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        radius: radius != null ? parseFloat(radius) : 250,
                        createdBy: user.id
                    }
                });
            }
        }

        return NextResponse.json(updatedProject);
    } catch (error) {
        console.error("Project update error:", error);
        return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }
}

export async function GET(req, { params }) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const project = await prisma.project.findUnique({
            where: { id: parseInt(id) },
            include: { managers: { select: { id: true, name: true, phone: true } } }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("GET project error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
