// Expense categories are seeded transactionally when a user creates their private workspace.
// This command is intentionally a no-op for production to avoid inserting demo transactions.
import { prisma } from "../lib/prisma";
async function main() {
  console.log("Danh mục được tạo khi onboarding. Không có dữ liệu giả được chèn.");
}
main().finally(() => prisma.$disconnect());
