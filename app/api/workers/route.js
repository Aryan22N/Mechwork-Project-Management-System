import { prisma } from "@/lib/db";
import { getUser, hasRole } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const where = {};
        if (status) where.status = status;

        const workers = await prisma.worker.findMany({
            where,
            orderBy: { name: "asc" }
        });

        return NextResponse.json(workers);
    } catch (error) {
        console.error("GET workers error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const user = await getUser();
        if (!user || !hasRole(user, ["PROJECT_MANAGER", "SUPER_ADMIN"])) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, address, designation, joining_date, status, notes } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const worker = await prisma.worker.create({
            data: {
                name,
                phone,
                address,
                designation,
                joining_date: joining_date ? new Date(joining_date) : new Date(),
                status: status || "ACTIVE",
                notes
            }
        });

        return NextResponse.json(worker, { status: 201 });
    } catch (error) {
        console.error("POST worker error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
