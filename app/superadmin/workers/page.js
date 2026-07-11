import WorkerDashboard from "@/components/WorkerDashboard";
import { getUser, hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuperAdminWorkersPage() {
    const user = await getUser();

    if (!user || !hasRole(user, "SUPER_ADMIN")) {
        redirect("/");
    }

    return <WorkerDashboard role="SUPER_ADMIN" />;
}
