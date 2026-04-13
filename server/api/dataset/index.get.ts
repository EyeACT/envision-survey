export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user?.id) throw createError({ statusCode: 401 });

  const userId = session.user.id;

  return await prisma.$transaction(async (tx) => {
    // 1. Get current assignments
    let assignments = await tx.assignment.findMany({
      where: { userId },
      include: { dataset: true },
      orderBy: { createdAt: 'asc' }
    });

    // 2. If first time, assign 100 records
    if (assignments.length === 0) {
      const available = await tx.dataset.findMany({
        where: { evaluationCount: { lt: 3 } },
        take: 100,
        orderBy: { id: 'asc' }
      });

      await tx.assignment.createMany({
        data: available.map(d => ({ userId, datasetId: d.id })),
        skipDuplicates: true
      });

      assignments = await tx.assignment.findMany({
        where: { userId },
        include: { dataset: true },
        orderBy: { createdAt: 'asc' }
      });
    }

    const datasets = assignments.map(a => a.dataset);

    // 3. Fetch existing evaluations so 'Back' button works after a refresh
    const evals = await tx.evaluation.findMany({
      where: { userId, datasetId: { in: datasets.map(d => d.id) } }
    });

    const evaluationMap = evals.reduce((acc, curr) => {
      acc[curr.datasetId] = curr;
      return acc;
    }, {} as Record<string, any>);

    return {
      datasets,
      evaluations: evaluationMap,
      total: datasets.length
    };
  });
});