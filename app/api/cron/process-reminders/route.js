import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
    try {
        // Secure the cron endpoint by checking for a secret header
        // If deploying to Vercel, use the CRON_SECRET environment variable
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const today = new Date();
        const currentDayOfMonth = today.getDate();

        const activeReminders = await prisma.reminder.findMany({
            where: {
                is_active: true,
                day_of_month: currentDayOfMonth
            }
        });

        if (activeReminders.length === 0) {
            return NextResponse.json({ message: "No reminders to process today." });
        }

        let processedCount = 0;

        for (const reminder of activeReminders) {
            // Check if we already processed this reminder this month to prevent duplicates
            // We use `last_triggered_at` for this.
            if (reminder.last_triggered_at) {
                const lastTriggered = new Date(reminder.last_triggered_at);
                if (lastTriggered.getMonth() === today.getMonth() && lastTriggered.getFullYear() === today.getFullYear()) {
                    continue; // Already triggered this month
                }
            }

            // Create a pending PM payment request for this reminder allowance
            // Since PaymentRequest requires a supervisor_id, we need to assign it to the system or a default admin.
            // For now, we will assign it to the project's PM or the Super Admin. Let's find the first PM.
            const adminUser = await prisma.user.findFirst({
                where: { role: "SUPER_ADMIN" }
            });

            if (!adminUser) {
                console.error("No SUPER_ADMIN found to assign the automated request to.");
                continue;
            }

            const paymentRequest = await prisma.paymentRequest.create({
                data: {
                    status: "PENDING_PM",
                    total_amount: reminder.amount,
                    supervisor_id: adminUser.id,
                    project_id: reminder.project_id,
                    materials: {
                        create: {
                            name: reminder.reason,
                            quantity: 1,
                            unit_price: reminder.amount,
                            worker_id: reminder.worker_id
                        }
                    }
                }
            });

            // Update the reminder's last_triggered_at
            await prisma.reminder.update({
                where: { id: reminder.id },
                data: { last_triggered_at: today }
            });

            processedCount++;
        }

        return NextResponse.json({ message: `Successfully processed ${processedCount} automated allowances.` });
    } catch (error) {
        console.error("Cron process-reminders error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
