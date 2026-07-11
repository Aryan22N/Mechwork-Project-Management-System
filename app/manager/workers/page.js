import WorkerDashboard from "@/components/WorkerDashboard";
import { getUser, hasRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ManagerWorkersPage() {
    const user = await getUser();

    if (!user || !hasRole(user, "PROJECT_MANAGER")) {
        redirect("/");
    }

    return <WorkerDashboard role="PROJECT_MANAGER" />;
}
