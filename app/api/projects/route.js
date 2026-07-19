import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const whereClause = {};
        if (status) whereClause.status = status;
        if (user.role === "PROJECT_MANAGER") {
            whereClause.managers = { some: { id: user.id } };
        }

        const projects = await prisma.project.findMany({
            where: whereClause,
            include: { managers: { select: { id: true, name: true, phone: true } } },
            orderBy: { created_at: "desc" }
        });

        // Find associated sites for these projects
        const projectNames = projects.map(p => `${p.name} - Site`);
        const sites = await prisma.site.findMany({
            where: { name: { in: projectNames } }
        });

        const siteMap = {};
        for (const site of sites) {
            siteMap[site.name] = site;
        }

        const projectsWithSites = projects.map(p => ({
            ...p,
            site: siteMap[`${p.name} - Site`] || null
        }));

        return NextResponse.json(projectsWithSites);
    } catch (error) {
        console.error("GET projects error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description, expense_heads, budget, manager_ids, latitude, longitude, radius } = await req.json();

        if (!name) {
            return NextResponse.json({ error: "Project name is required" }, { status: 400 });
        }

        if (!manager_ids || !Array.isArray(manager_ids) || manager_ids.length === 0) {
            return NextResponse.json({ error: "At least one manager is required" }, { status: 400 });
        }

        // Create the Project
        const project = await prisma.project.create({
            data: {
                name,
                description: description || "",
                expense_heads: Array.isArray(expense_heads) ? expense_heads : [],
                budget: budget ? parseFloat(budget) : null,
                managers: {
                    connect: manager_ids.map(id => ({ id: parseInt(id) }))
                },
            },
            include: { managers: { select: { id: true, name: true, phone: true } } },
        });

        // Create the Site if coordinates are provided
        if (latitude != null && longitude != null) {
            await prisma.site.create({
                data: {
                    name: `${name} - Site`,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    radius: radius ? parseFloat(radius) : 250,
                    createdBy: user.id
                }
            });
        }

        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error("Project creation error:", error);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
