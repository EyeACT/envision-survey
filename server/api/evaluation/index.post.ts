import { z } from "zod";

// 1. Validation Schema
const evaluationSchema = z.object({
  datasetId: z.string(),
  confidence: z.number().min(0).max(5),
  label: z.string(),
  comment: z.string().optional().nullable(),
});

export default defineEventHandler(async (event) => {
  // 2. Get the session
  const session = await getUserSession(event);
  if (!session.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: Please log in.",
    });
  }

  const userId = session.user.id;

  // 3. Validate Request Body
  const body = await readValidatedBody(event, (b) => evaluationSchema.safeParse(b));
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid evaluation data.",
    });
  }

  const { datasetId, confidence, label, comment } = body.data;

  try {
    return await prisma.$transaction(async (tx) => {
      // 4. Check if this is a NEW evaluation or an UPDATE
      const existing = await tx.evaluation.findUnique({
        where: {
          userId_datasetId: { userId, datasetId }
        }
      });

      // 5. Limit Check: Only allow 100 total evaluations per user
      if (!existing) {
        const userTotal = await tx.evaluation.count({
          where: { userId }
        });

        if (userTotal >= 100) {
          throw createError({
            statusCode: 403,
            statusMessage: "Limit reached: You have already completed 100 records.",
          });
        }

        // 6. Global Cap: Don't allow submission if record already has 3+ reviews
        const dataset = await tx.dataset.findUnique({
          where: { id: datasetId },
          select: { evaluationCount: true }
        });

        if (dataset && dataset.evaluationCount >= 3) {
          throw createError({
            statusCode: 409,
            statusMessage: "This record already has enough reviews.",
          });
        }
      }

      // 7. Save the Evaluation
      const result = await tx.evaluation.upsert({
        where: {
          userId_datasetId: { userId, datasetId }
        },
        update: {
          confidence,
          label,
          comment: comment ?? null,
        },
        create: {
          userId,
          datasetId,
          confidence,
          label,
          comment: comment ?? null,
        }
      });

      // 8. Update the global count on the Dataset model
      const totalForDataset = await tx.evaluation.count({
        where: { datasetId }
      });

      await tx.dataset.update({
        where: { id: datasetId },
        data: { evaluationCount: totalForDataset }
      });

      return result;
    });
  } catch (error: any) {
    // Pass through our custom createErrors
    if (error.statusCode) throw error;

    console.error("Evaluation Save Error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});