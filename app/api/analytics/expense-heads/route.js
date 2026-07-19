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
        const projectId = searchParams.get("projectId");
        const head = searchParams.get("head");

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        const materials = await prisma.material.findMany({
            where: {
                request: {
                    project_id: parseInt(projectId, 10),
                    status: "PAID"
                }
            }
        });

        const breakdown = {};
        let totalSpent = 0;
        let selectedHeadAmount = 0;

        materials.forEach(m => {
            const amount = Number(m.quantity) * Number(m.unit_price);
            totalSpent += amount;
            
            const materialName = m.name.trim();
            if (breakdown[materialName]) {
                breakdown[materialName] += amount;
            } else {
                breakdown[materialName] = amount;
            }
        });

        if (head) {
            const targetHead = head.trim();
            // Try exact match or case-insensitive match
            const exactKey = Object.keys(breakdown).find(k => k.toLowerCase() === targetHead.toLowerCase());
            if (exactKey) {
                selectedHeadAmount = breakdown[exactKey];
            }
        }

        const otherCategoriesAmount = totalSpent - selectedHeadAmount;

        return NextResponse.json({
            projectId: parseInt(projectId, 10),
            head,
            selectedHeadAmount,
            otherCategoriesAmount,
            totalSpent,
            breakdown
        });

    } catch (error) {
        console.error("GET expense heads analytics error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
