import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * TRD seed: per-employee per-location balances (balanceDays stored as decimal strings).
 */
async function main(): Promise<void> {
  const balances = [
    { employeeId: "A", locationId: "CURITIBA_HQ", balanceDays: "20.0" },
    { employeeId: "B", locationId: "CURITIBA_HQ", balanceDays: "0.0" },
    { employeeId: "C", locationId: "US_OFFICE", balanceDays: "7.5" },
  ] as const;

  for (const row of balances) {
    await prisma.employeeBalance.upsert({
      where: {
        employeeId_locationId: {
          employeeId: row.employeeId,
          locationId: row.locationId,
        },
      },
      create: {
        employeeId: row.employeeId,
        locationId: row.locationId,
        balanceDays: row.balanceDays,
      },
      update: { balanceDays: row.balanceDays },
    });
  }

  console.log(
    `Seeded ${balances.length} employee balance row(s): A/B @ CURITIBA_HQ, C @ US_OFFICE.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
