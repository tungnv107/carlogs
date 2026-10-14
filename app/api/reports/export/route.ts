import { requireOrganizationAccess } from "@/modules/auth/guards";
import { getReportScope } from "@/modules/reporting/service";
import { prisma } from "@/lib/prisma";
import { writeCSV } from "@/lib/csv-export";
import { writeXLSX } from "@/lib/xlsx-export";

export const runtime = "nodejs";
const MAX_EXPORT = 10000;
const dateVN = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short" });

export async function GET(request: Request) {
  const { organization, user, membership } = await requireOrganizationAccess(["OWNER", "ADMIN", "MANAGER", "ACCOUNTANT"]);
  const query = new URL(request.url).searchParams;
  const format = query.get("format");
  if (format !== "csv" && format !== "xlsx") return Response.json({ error: "Định dạng không được hỗ trợ." }, { status: 400 });
  try {
    const selection = { from: query.get("from") ?? undefined, to: query.get("to") ?? undefined, vehicleId: query.get("vehicleId") ?? undefined, categoryId: query.get("categoryId") ?? undefined };
    const scope = await getReportScope(organization.id, user.id, membership.role, selection);
    const count = await prisma.expense.count({ where: scope.where });
    if (count > MAX_EXPORT) return Response.json({ error: "Hãy lọc kỳ ngắn hơn để xuất tối đa 10.000 dòng." }, { status: 422 });
    const entries = await prisma.expense.findMany({ where: scope.where, include: { vehicle: { select: { plate: true, name: true } }, category: { select: { name: true } }, createdBy: { select: { name: true, email: true } }, _count: { select: { attachments: true } } }, orderBy: [{ occurredAt: "desc" }, { id: "desc" }], take: MAX_EXPORT });
    const rows = [
      ["Ngày", "Biển số", "Phương tiện", "Danh mục", "Nội dung", "Đơn vị", "Odometer", "Người nhập", "Số chứng từ", "Số tiền (VND)"],
      ...entries.map(e => [dateVN.format(e.occurredAt), e.vehicle.plate, e.vehicle.name, e.category.name, e.description ?? "", e.vendor ?? "", e.odometer ?? "", e.createdBy.name ?? e.createdBy.email ?? "", e._count.attachments, e.amount.toString()])
    ];
    if (format === "xlsx") {
      const sum = await prisma.expense.aggregate({ where: scope.where, _sum: { amount: true } });
      const selectedVehicle = scope.vehicles.find(vehicle => vehicle.id === selection.vehicleId);
      const selectedCategory = scope.categories.find(category => category.id === selection.categoryId);
      const vehicleLabel = selection.vehicleId ? (selectedVehicle ? `${selectedVehicle.plate} · ${selectedVehicle.name}` : "Không thuộc phạm vi truy cập") : "Tất cả được phép";
      const categoryLabel = selection.categoryId ? (selectedCategory?.name ?? "Không tìm thấy") : "Tất cả";
      const workbook = writeXLSX({
        title: "BÁO CÁO CHI TIẾT CHI PHÍ PHƯƠNG TIỆN",
        subtitle: `Kỳ: ${scope.period.from} – ${scope.period.to} | Xe: ${vehicleLabel} | Danh mục: ${categoryLabel}`,
        headers: rows[0].map(String),
        rows: rows.slice(1).map(row => row.map((value, i) => i === row.length - 1 ? String(value) : value === null ? null : String(value))),
        total: sum._sum.amount?.toString() ?? "0"
      });
      return new Response(new Uint8Array(workbook), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": `attachment; filename="bao-cao-${scope.period.from}-${scope.period.to}.xlsx"`, "cache-control": "no-store" } });
    }
    return new Response(writeCSV(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="bao-cao-${scope.period.from}-${scope.period.to}.csv"`, "cache-control": "no-store" } });
  } catch { return Response.json({ error: "Bộ lọc hoặc truy vấn không hợp lệ." }, { status: 400 }); }
}
