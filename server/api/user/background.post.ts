import { z } from "zod";

const backgroundSchema = z.object({
  careerLevel: z.string().min(1),
  primaryBackground: z.string().min(1),
  imagingFamiliarity: z.string().min(1),
  imagingFamiliarityScore: z.number().min(0).max(4),
  experienceYears: z.string().min(1), // Now a string range
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const body = await readValidatedBody(event, (b) => backgroundSchema.safeParse(b));
  if (!body.success) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: "Invalid background data",
      data: body.error.flatten() 
    });
  }

  const { 
    careerLevel, 
    primaryBackground, 
    imagingFamiliarity, 
    imagingFamiliarityScore, 
    experienceYears 
  } = body.data;

  return await prisma.user.update({
    where: { id: session.user.id },
    data: {
      careerLevel,
      primaryBackground,
      imagingFamiliarity,
      imagingFamiliarityScore,
      experienceYears,
    },
  });
});