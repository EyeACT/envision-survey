import { z } from "zod";

const LABELS = ["eye-imaging", "eye-software", "eye-other", "non-eye"] as const;

const bodySchema = z.object({
  datasetId: z.string(),
  label: z.enum(LABELS),
  confidence: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  const { user } = session;

  const body = await readValidatedBody(event, bodySchema.parse);

  const evaluation = await prisma.evaluation.upsert({
    where: {
      userId_datasetId: {
        userId: user.id,
        datasetId: body.datasetId,
      },
    },
    create: {
      userId: user.id,
      datasetId: body.datasetId,
      label: body.label,
      confidence: body.confidence,
      comment: body.comment,
    },
    update: {
      label: body.label,
      confidence: body.confidence,
      comment: body.comment,
    },
  });

  return evaluation;
});
