import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Re-sign token for another 24 hours
        const newToken = jwt.sign(
            {
                id: decoded.id,
                phone: decoded.phone,
                role: decoded.role,
                name: decoded.name,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const response = NextResponse.json({
            authenticated: true,
            role: decoded.role,
            name: decoded.name,
        });

        response.cookies.set("token", newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24, // 1 day
        });

        return response;
    } catch (error) {
        // Token invalid or expired
        const response = NextResponse.json({ authenticated: false }, { status: 401 });
        response.cookies.delete("token");
        return response;
    }
}
