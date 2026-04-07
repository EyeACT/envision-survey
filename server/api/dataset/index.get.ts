export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const userId = session.user.id;

  // 1. Count how many the user has already done
  const completedCount = await prisma.evaluation.count({
    where: { userId: userId }
  });

  // 2. If they hit the limit, return empty datasets
  if (completedCount >= 100) {
    return {
      datasets: [],
      evaluations: {},
      isFinished: true // Flag for the frontend
    };
  }

  // 3. Otherwise, fetch the remaining records up to the 100 limit
  const limitRemaining = 100 - completedCount;

  const datasets = await prisma.dataset.findMany({
    where: {
      evaluationCount: { lt: 3 },
      evaluations: { none: { userId: userId } }
    },
    take: Math.min(limitRemaining, 100), 
  });

  const userEvaluations = await prisma.evaluation.findMany({
    where: { userId: userId }
  });

  const evaluationMap = userEvaluations.reduce((acc, curr) => {
    acc[curr.datasetId] = curr;
    return acc;
  }, {} as Record<string, any>);

  return {
    datasets,
    evaluations: evaluationMap,
    isFinished: false
  };
});