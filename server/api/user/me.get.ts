export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user?.id) {
    throw createError({ statusCode: 401 });
  }

  return await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      careerLevel: true,
      primaryBackground: true,
      imagingFamiliarity: true,
    }
  });
});