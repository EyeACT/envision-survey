import { z } from "zod";

const evaluationSchema = z.object({
  datasetId: z.string(),
  confidence: z.number(),
  label: z.string(),
  comment: z.string().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session.user?.id) throw createError({ statusCode: 401 });

  const userId = session.user.id;
  const body = await readBody(event);
  const result = evaluationSchema.safeParse(body);

  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid Data" });
  }

  const { datasetId, confidence, label, comment } = result.data;

  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verify assignment exists
      const assignment = await tx.assignment.findUnique({
        where: { userId_datasetId: { userId, datasetId } }
      });

      if (!assignment) {
        throw createError({ statusCode: 403, statusMessage: "Not assigned to you" });
      }

      // 2. Save evaluation (Model name must match schema)
      const evaluation = await tx.evaluation.upsert({
        where: { userId_datasetId: { userId, datasetId } },
        update: { confidence, label, comment },
        create: { userId, datasetId, confidence, label, comment }
      });

      // 3. Update the counter on Dataset
      const count = await tx.evaluation.count({ where: { datasetId } });
      await tx.dataset.update({
        where: { id: datasetId },
        data: { evaluationCount: count }
      });

      return evaluation;
    });
  } catch (error: any) {
    console.error("DB Error:", error);
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
});