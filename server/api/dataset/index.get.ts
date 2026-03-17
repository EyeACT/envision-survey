export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { user } = session;

  // Load user with current posterOrder (reused to store dataset IDs)
  let dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
  });

  // If no order yet, generate a randomized one and persist it
  if (dbUser.posterOrder.length === 0) {
    const allDatasets = await prisma.dataset.findMany({ select: { id: true } });
    const shuffled = allDatasets
      .map((d) => d.id)
      .sort(() => Math.random() - 0.5);

    dbUser = await prisma.user.update({
      where: { id: user.id },
      data: { posterOrder: shuffled },
    });
  }

  // Fetch datasets in the user's order
  const datasetMap = await prisma.dataset
    .findMany({
      where: { id: { in: dbUser.posterOrder } },
    })
    .then((rows) => new Map(rows.map((d) => [d.id, d])));

  const datasets = dbUser.posterOrder
    .map((id) => datasetMap.get(id))
    .filter(Boolean);

  // Fetch existing evaluations keyed by datasetId
  const evalRows = await prisma.evaluation.findMany({
    where: { userId: user.id },
  });
  const evaluations = Object.fromEntries(
    evalRows.map((e) => [e.datasetId, e]),
  );

  return { datasets, evaluations };
});
