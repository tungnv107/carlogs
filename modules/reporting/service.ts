import { Prisma, type MemberRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { vehicleScope, expenseScope } from "@/lib/access-scope";
import { reportPeriod, tripWithinReportPeriod, boundedReportPage } from "@/lib/report-period";
import { todayVN } from "@/lib/finance";
import { vehicleCostPerKm } from "@/lib/report-vehicle";
import { compareVndAmounts } from "@/lib/report-share";

export type ReportSelection = { from?: string; to?: string; vehicleId?: string; categoryId?: string; page?: string };

export async function getReportScope(orgId: string, userId: string, role: MemberRole, selection: ReportSelection) {
  const today = todayVN();
  const from = selection.from || `${today.slice(0, 7)}-01`;
  const to = selection.to || today;
  const period = reportPeriod(from, to);
  const [vehicles, categories] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId: orgId, ...vehicleScope(role, userId) }, select: { id: true, name: true, plate: true }, orderBy: { plate: "asc" } }),
    prisma.expenseCategory.findMany({ where: { organizationId: orgId }, select: { id: true, name: true, group: true }, orderBy: { name: "asc" } })
  ]);
  const vehicleIds = vehicles.filter(vehicle => !selection.vehicleId || vehicle.id === selection.vehicleId).map(vehicle => vehicle.id);
  const categoryIds = categories.filter(category => !selection.categoryId || category.id === selection.categoryId).map(category => category.id);
  const where: Prisma.ExpenseWhereInput = {
    organizationId: orgId, status: "POSTED", ...expenseScope(role, userId),
    vehicleId: { in: vehicleIds }, categoryId: { in: categoryIds },
    occurredAt: { gte: period.start, lt: period.endExclusive }
  };
  return { period, vehicles, categories, vehicleIds, categoryIds, where };
}

export async function getReporting(orgId: string, userId: string, role: MemberRole, selection: ReportSelection) {
  const { period, vehicles, categories, vehicleIds, categoryIds, where } = await getReportScope(orgId, userId, role, selection);
  const [total, previous, categoryRows, vehicleRows, previousVehicleRows, fuelVehicleRows, tripVehicleRows, tripTotals, detailsCount, reminderCount] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ where: { ...where, occurredAt: { gte: period.previousStart, lt: period.previousEndExclusive } }, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ["categoryId"], where, _sum: { amount: true }, _count: true }),
    prisma.expense.groupBy({ by: ["vehicleId"], where, _sum: { amount: true }, _count: true }),
    prisma.expense.groupBy({ by: ["vehicleId"], where: { ...where, occurredAt: { gte: period.previousStart, lt: period.previousEndExclusive } }, _sum: { amount: true } }),
    prisma.expense.groupBy({ by: ["vehicleId"], where: { ...where, fuelLog: { isNot: null } }, _sum: { amount: true } }),
    prisma.tripLog.groupBy({ by: ["vehicleId"], where: { organizationId: orgId, vehicleId: { in: vehicleIds }, ...tripWithinReportPeriod(period) }, _sum: { distance: true }, _count: true }),
    // A trip crossing the requested cutoff cannot be split into verified km.
    // Only journeys completely inside the period contribute to the denominator.
    prisma.tripLog.aggregate({ where: { organizationId: orgId, vehicleId: { in: vehicleIds }, ...tripWithinReportPeriod(period) }, _sum: { distance: true }, _count: true }),
    prisma.expense.count({ where }),
    prisma.reminder.count({ where: { organizationId: orgId, vehicleId: { in: vehicleIds }, status: { in: ["UPCOMING", "DUE", "OVERDUE"] } } })
  ]);
  const pageSize = 20;
  const page = boundedReportPage(selection.page, detailsCount, pageSize);
  const details = await prisma.expense.findMany({ where, include: { vehicle: { select: { name: true, plate: true } }, category: { select: { name: true } }, createdBy: { select: { name: true, email: true } }, attachments: { select: { id: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], skip: (page - 1) * pageSize, take: pageSize });

  // SQL groups months in business timezone and sums only the canonical POSTED ledger.
  // Prisma.sql parameterizes organization and scoped IDs; no client-provided SQL fragments.
  // Never interpolate an empty IN list: Prisma.join([]) throws before the query runs.
  const hasScope = vehicleIds.length > 0 && categoryIds.length > 0;
  const clause = hasScope ? Prisma.sql`e."organizationId" = ${orgId} AND e."status" = 'POSTED' AND e."vehicleId" IN (${Prisma.join(vehicleIds)}) AND e."categoryId" IN (${Prisma.join(categoryIds)})` : Prisma.sql`FALSE`;
  type Monthly = { month: string; amount: Prisma.Decimal };
  type Energy = { unit: string; quantity: Prisma.Decimal; amount: Prisma.Decimal };
  const [monthly, energy, fuelMonthly, tripMonthly] = hasScope ? await Promise.all([
    prisma.$queryRaw<Monthly[]>(Prisma.sql`SELECT to_char(e."occurredAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') AS month, SUM(e."amount") AS amount FROM "Expense" e WHERE ${clause} AND e."occurredAt" >= ${period.start} AND e."occurredAt" < ${period.endExclusive} GROUP BY 1 ORDER BY 1`),
    prisma.$queryRaw<Energy[]>(Prisma.sql`SELECT f."unit"::text AS unit, SUM(f."quantity") AS quantity, SUM(e."amount") AS amount FROM "FuelLog" f JOIN "Expense" e ON e."id" = f."expenseId" AND e."organizationId" = f."organizationId" WHERE ${clause} AND e."occurredAt" >= ${period.start} AND e."occurredAt" < ${period.endExclusive} GROUP BY f."unit"`),
    prisma.$queryRaw<Monthly[]>(Prisma.sql`SELECT to_char(e."occurredAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') AS month, SUM(e."amount") AS amount FROM "FuelLog" f JOIN "Expense" e ON e."id" = f."expenseId" AND e."organizationId" = f."organizationId" WHERE ${clause} AND e."occurredAt" >= ${period.start} AND e."occurredAt" < ${period.endExclusive} GROUP BY 1 ORDER BY 1`),
    // A journey crossing months belongs wholly to its completion month.
    // This matches the full-period distance without estimating partial kilometers.
    prisma.$queryRaw<{ month: string; distance: bigint }[]>(Prisma.sql`SELECT to_char(t."endedAt" AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') AS month, SUM(t."distance") AS distance FROM "TripLog" t WHERE t."organizationId" = ${orgId} AND t."vehicleId" IN (${Prisma.join(vehicleIds)}) AND t."startedAt" >= ${period.start} AND t."endedAt" < ${period.endExclusive} GROUP BY 1 ORDER BY 1`)
  ]) : [[], [], [], []];

  const categoryMap = new Map(categories.map(v => [v.id, v]));
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
  const byCategory = categoryRows.map(row => ({ key: row.categoryId, label: categoryMap.get(row.categoryId)?.name ?? "Danh mục khác", group: categoryMap.get(row.categoryId)?.group ?? "", amount: row._sum.amount?.toString() ?? "0", count: row._count })).sort((a, b) => compareVndAmounts(b.amount, a.amount));
  const byVehicle = vehicleRows.map(row => ({ key: row.vehicleId, label: `${vehicleMap.get(row.vehicleId)?.plate ?? "Xe"} · ${vehicleMap.get(row.vehicleId)?.name ?? ""}`, amount: row._sum.amount?.toString() ?? "0", count: row._count })).sort((a, b) => compareVndAmounts(b.amount, a.amount));
  const totalAmount = total._sum.amount?.toString() ?? "0";
  const distance = tripTotals._count > 0 ? tripTotals._sum.distance ?? 0 : null;
  const costPerKm = vehicleCostPerKm(totalAmount, distance);
  const prevVehicleMap = new Map(previousVehicleRows.map(row => [row.vehicleId, row._sum.amount?.toString() ?? "0"]));
  const fuelVehicleMap = new Map(fuelVehicleRows.map(row => [row.vehicleId, row._sum.amount?.toString() ?? "0"]));
  const tripVehicleMap = new Map(tripVehicleRows.map(row => [row.vehicleId, row._count > 0 ? row._sum.distance ?? 0 : null]));
  const comparedVehicles = vehicles.filter(v => vehicleIds.includes(v.id)).map(v => {
    const current = vehicleRows.find(row => row.vehicleId === v.id);
    const amount = current?._sum.amount?.toString() ?? "0";
    const km = tripVehicleMap.get(v.id) ?? null;
    return { id: v.id, label: `${v.plate} · ${v.name}`, amount,
      count: current?._count ?? 0, previousAmount: prevVehicleMap.get(v.id) ?? "0",
      fuelAmount: fuelVehicleMap.get(v.id) ?? "0", distance: km, costPerKm: vehicleCostPerKm(amount, km) };
  }).sort((a, b) => new Prisma.Decimal(b.amount).comparedTo(a.amount));
  const tripMap = new Map(tripMonthly.map(row => [row.month, row.distance]));
  return {
    period, vehicles, categories, selection, page, pageSize, detailsCount,
    details, byCategory, byVehicle, comparedVehicles,
    monthly: monthly.map(row => ({ label: row.month, amount: row.amount.toString() })),
    fuelMonthly: fuelMonthly.map(row => ({ label: row.month, amount: row.amount.toString() })),
    costPerKmMonthly: monthly.filter(row => (tripMap.get(row.month) ?? 0n) > 0n).map(row => ({ label: row.month, amount: row.amount.div(String(tripMap.get(row.month))).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toString() })),
    energy: energy.map(row => ({ unit: row.unit, quantity: row.quantity.toString(), amount: row.amount.toString(), average: row.quantity.gt(0) ? row.amount.div(row.quantity).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toString() : null })),
    totalAmount, previousAmount: previous._sum.amount?.toString() ?? "0", expenseCount: total._count,
    distance, costPerKm, reminderCount, vehicleCount: vehicleIds.length
  };
}
