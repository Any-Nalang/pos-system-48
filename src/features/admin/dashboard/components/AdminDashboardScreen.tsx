import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TodayOrdersTable } from "@/features/admin/orders/components/TodayOrdersTable";
import { getTodayOrdersQueryOptions } from "@/features/admin/orders/queryOptions";
import { sessionQueryOptions } from "@/features/auth/queryOptions";
import type { PaymentMethodFilter } from "../constants";
import {
  getDashboardDataQueryOptions,
  getMonthlyDataQueryOptions,
  getAvailableMonthsQueryOptions,
  getAdminReconciliationQueryOptions,
  getAdminCupSalesQueryOptions,
} from "../queryOptions";
import { CupSalesBreakdown } from "./CupSalesBreakdown";
import { DashboardReceiptDialog } from "./DashboardReceiptDialog";
import { RevenueCard } from "./RevenueCard";

export function AdminDashboardScreen() {
  const { data } = useSuspenseQuery(getDashboardDataQueryOptions);
  const { data: session } = useSuspenseQuery(sessionQueryOptions);
  const { data: todayOrders } = useSuspenseQuery(getTodayOrdersQueryOptions);
  const { data: availableMonths } = useSuspenseQuery(getAvailableMonthsQueryOptions);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethodFilter>("all");
  const [receiptMode, setReceiptMode] = useState<
    | "select"
    | "monthly"
    | "monthPicker"
    | "dailyRevenue"
    | "cups"
    | "cupsDatePicker"
    | "xreading"
    | "xreadingDatePicker"
    | null
  >(null);
  const [receiptDate, setReceiptDate] = useState<"today" | "yesterday">("today");

  const latest = availableMonths[0];
  const [selectedYear, setSelectedYear] = useState(latest?.year ?? new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(latest?.month ?? new Date().getMonth() + 1);

  const { data: monthlyData } = useQuery(
    getMonthlyDataQueryOptions(selectedYear, selectedMonth),
  );

  const { data: reconciliation } = useQuery({
    ...getAdminReconciliationQueryOptions(receiptDate),
    enabled: receiptMode === "xreading",
  });

  const { data: cupSalesData } = useQuery({
    ...getAdminCupSalesQueryOptions(receiptDate),
    enabled: receiptMode === "cups",
  });

  const { revenue, cupSales, periodLabel } = data;
  const staffName = session?.user?.name ?? "Admin";

  const handleOpenMonthPicker = () => {
    const latestMonth = availableMonths[0];
    if (latestMonth) {
      setSelectedYear(latestMonth.year);
      setSelectedMonth(latestMonth.month);
    }
    setReceiptMode("monthPicker");
  };

  const handleConfirmMonth = () => {
    setReceiptMode("monthly");
  };

  const handleSelectCupsDate = (date: "today" | "yesterday") => {
    setReceiptDate(date);
    setReceiptMode("cups");
  };

  const handleSelectXReadingDate = (date: "today" | "yesterday") => {
    setReceiptDate(date);
    setReceiptMode("xreading");
  };

  const resetReceipt = () => {
    setReceiptMode(null);
  };

  const currentReceiptMode: "monthly" | "dailyRevenue" | "cups" | "xreading" | null =
    receiptMode === "monthly"
      ? "monthly"
      : receiptMode === "dailyRevenue"
        ? "dailyRevenue"
        : receiptMode === "cups"
          ? "cups"
          : receiptMode === "xreading"
            ? "xreading"
            : null;

  return (
    <div className="space-y-5">
      <RevenueCard
        revenueByMethod={revenue.byMethod}
        ordersByMethod={revenue.ordersByMethod}
        selectedPayment={selectedPayment}
        onPaymentChange={setSelectedPayment}
        periodLabel={periodLabel}
        onExportClick={() => setReceiptMode("select")}
      />

      <CupSalesBreakdown
        cupSales={cupSales}
        selectedPayment={selectedPayment}
      />

      <TodayOrdersTable data={todayOrders} limit={10} />

      <Dialog
        open={receiptMode === "select"}
        onOpenChange={(open) => {
          if (!open) setReceiptMode(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Print Receipt</DialogTitle>
            <DialogDescription>
              Print a monthly summary receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleOpenMonthPicker}
              className="h-auto w-full rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-2 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Monthly Summary Receipt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiptMode("dailyRevenue")}
              className="h-auto w-full rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-2 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Daily Sales Receipt
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiptMode("cupsDatePicker")}
              className="h-auto w-full rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-2 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Print Cup Sold
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiptMode("xreadingDatePicker")}
              className="h-auto w-full rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-2 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Print X-Reading
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReceiptMode(null)}
              className="text-xs font-semibold text-(--dark-gray)"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={receiptMode === "monthPicker"}
        onOpenChange={(open) => {
          if (!open) setReceiptMode(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Select Month</DialogTitle>
            <DialogDescription>
              Choose the month for the summary receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {availableMonths.map((m) => (
              <Button
                key={`${m.year}-${m.month}`}
                type="button"
                variant={selectedYear === m.year && selectedMonth === m.month ? "default" : "outline"}
                onClick={() => {
                  setSelectedYear(m.year);
                  setSelectedMonth(m.month);
                }}
                className={`h-auto w-full rounded-xl px-4 py-3 text-xs font-semibold ${
                  selectedYear === m.year && selectedMonth === m.month
                    ? "bg-(--deep-forest) text-white hover:bg-(--deep-forest)/90"
                    : "border-(--light-gray) bg-(--off-white) text-(--dark-gray) hover:bg-(--off-white)"
                }`}
              >
                {m.label}
              </Button>
            ))}
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReceiptMode("select")}
              className="flex-1 rounded-xl px-4 py-3 text-xs font-semibold"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMonth}
              className="flex-1 rounded-xl px-4 py-3 text-xs font-semibold text-white bg-(--deep-forest) hover:bg-(--deep-forest)/90"
            >
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={receiptMode === "cupsDatePicker"}
        onOpenChange={(open) => {
          if (!open) setReceiptMode(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
            <DialogDescription>
              Choose the date for cup sold data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectCupsDate("today")}
              className="flex-1 h-auto rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-3 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectCupsDate("yesterday")}
              className="flex-1 h-auto rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-3 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Yesterday
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReceiptMode("select")}
              className="text-xs font-semibold text-(--dark-gray)"
            >
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={receiptMode === "xreadingDatePicker"}
        onOpenChange={(open) => {
          if (!open) setReceiptMode(null);
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Select Date</DialogTitle>
            <DialogDescription>
              Choose the date for X-Reading data.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectXReadingDate("today")}
              className="flex-1 h-auto rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-3 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSelectXReadingDate("yesterday")}
              className="flex-1 h-auto rounded-xl border-(--light-gray) bg-(--off-white) px-4 py-3 text-xs font-semibold text-(--dark-gray) hover:bg-(--off-white)"
            >
              Yesterday
            </Button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setReceiptMode("select")}
              className="text-xs font-semibold text-(--dark-gray)"
            >
              Back
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DashboardReceiptDialog
        open={!!currentReceiptMode}
        onClose={resetReceipt}
        mode={currentReceiptMode}
        staffName={staffName}
        receiptDate={receiptDate}
        monthlyData={monthlyData}
        dailyData={{
          totalCashSales: data.revenue.byMethod.CASH ?? 0,
          totalGcashSales: data.revenue.byMethod.GCASH ?? 0,
          totalRevenue: (data.revenue.byMethod.CASH ?? 0) + (data.revenue.byMethod.GCASH ?? 0),
        }}
        cupSales={cupSalesData ?? []}
        reconciliation={
          reconciliation ?? {
            totalCashSales: 0,
            totalGcashSales: 0,
            totalGrabSales: 0,
            totalCashOut: 0,
            totalCashIn: 0,
            totalExpenses: 0,
          }
        }
      />
    </div>
  );
}
