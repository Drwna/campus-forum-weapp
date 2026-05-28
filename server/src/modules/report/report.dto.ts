import { z } from "zod";

// 举报目标类型：1=帖子, 2=评论
export const CreateReportSchema = z.object({
  targetType: z.number().int().min(1).max(2),
  targetId: z.string().min(1),
  reasonType: z.number().int().min(1).max(6),
  reasonText: z.string().max(500).optional(),
});

export type CreateReportDTO = z.infer<typeof CreateReportSchema>;
