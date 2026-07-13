import { createFileRoute } from "@tanstack/react-router";
import { prisma } from "@/integrations/prisma/db";

const RETENTION_MONTHS = 6;
const ORDER_BATCH_SIZE = 500;
const MAX_ORDER_BATCHES = 80;

function getCronToken(request: Request) {
	const authHeader = request.headers.get("authorization");
	const headerToken = authHeader?.replace(/^bearer\s+/i, "");
	if (headerToken) return headerToken;
	const url = new URL(request.url);
	return url.searchParams.get("token");
}

export const Route = createFileRoute("/api/cron/purge-old-data")({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) => {
				const expectedToken = process.env.CRON_SECRET;
				const receivedToken = getCronToken(request);
				if (expectedToken && receivedToken !== expectedToken) {
					return new Response("Unauthorized", { status: 401 });
				}

				const cutoff = new Date();
				cutoff.setMonth(cutoff.getMonth() - RETENTION_MONTHS);
				const now = new Date();

				let orders = 0;
				let ordersDrained = false;
				const orderErrors: string[] = [];
				for (let i = 0; i < MAX_ORDER_BATCHES; i++) {
					try {
						const n = await prisma.$executeRaw`
							delete from orders
							where order_id in (
								select order_id from orders
								where created_at < ${cutoff}
								limit ${ORDER_BATCH_SIZE}
							)`;
						orders += n;
						if (n < ORDER_BATCH_SIZE) {
							ordersDrained = true;
							break;
						}
					} catch (e) {
						orderErrors.push(
							e instanceof Error ? e.message : String(e),
						);
						break;
					}
				}

				const expenses = await prisma.expense.deleteMany({
					where: { timestamp: { lt: cutoff } },
				});
				const inventoryLog = await prisma.inventoryLog.deleteMany({
					where: { date_time: { lt: cutoff } },
				});
				const sessions = await prisma.session.deleteMany({
					where: { expiresAt: { lt: now } },
				});
				const verifications = await prisma.verification.deleteMany({
					where: { expiresAt: { lt: now } },
				});

				return Response.json({
					cutoff: cutoff.toISOString(),
					ordersDrained,
					orderErrors,
					deleted: {
						orders,
						expenses: expenses.count,
						inventoryLog: inventoryLog.count,
						sessions: sessions.count,
						verifications: verifications.count,
					},
				});
			},
		},
	},
});
