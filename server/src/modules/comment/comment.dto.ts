import { z } from "zod";

export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
  replyToUserId: z.string().optional(),
});

export const CommentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
  parentId: z.string().optional(),
});

export type CreateCommentDTO = z.infer<typeof CreateCommentSchema>;
export type CommentListQueryDTO = z.infer<typeof CommentListQuerySchema>;
