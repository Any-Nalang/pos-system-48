import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	RouteErrorBoundary,
	RoutePendingBoundary,
} from "@/components/route-boundaries";
import { XReadingScreen } from "@/features/staff/xreading/components/XReadingScreen";
import { getDailyReconciliationQueryOptions } from "@/features/staff/xreading/queryOptions";
import { authClient } from "@/integrations/better-auth/auth-client";

import { z } from "zod";

const searchSchema = z.object({
	date: z.enum(["today", "yesterday"]).optional().default("today"),
	mode: z.enum(["me", "all"]).optional().default("me"),
});

export const Route = createFileRoute("/staff/xreading")({
	validateSearch: searchSchema,
	pendingComponent: RoutePendingBoundary,
	errorComponent: RouteErrorBoundary,
	component: StaffXReading,
});

function StaffXReading() {
	const { date, mode } = Route.useSearch();
	const { data: session } = authClient.useSession();
	const staffId = session?.user?.id;

	const { data: reconciliationData } = useSuspenseQuery(
		getDailyReconciliationQueryOptions(date, mode === "me" ? staffId : undefined),
	);

	return (
		<div className="min-h-screen bg-(--pale-yellow)/30">
			<main className="mx-auto max-w-screen-2xl p-2 sm:p-3 lg:p-4">
				<XReadingScreen date={date} data={reconciliationData} mode={mode} staffId={staffId} />
			</main>
		</div>
	);
}
