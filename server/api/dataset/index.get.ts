export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { user } = session;

  // Get all datasets with their evaluation counts, excluding ones the user has already evaluated
  const datasets = await prisma.dataset.findMany({
    where: {
      evaluation: {
        none: { userId: user.id },
      },
    },
    include: {
      _count: { select: { evaluation: true } },
    },
    orderBy: {
      evaluation: { _count: "asc" },
    },
  });

  return { datasets };
});
