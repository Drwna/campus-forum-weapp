import { z } from "zod";

export const SubmitProfileReviewSchema = z.object({
  nickname: z.string().min(1).max(64).optional(),
  avatar: z.string().url().max(512).optional(),
  bio: z.string().max(200).optional(),
  gender: z.number().int().min(0).max(2).optional(),
  age: z.number().int().min(1).max(150).optional(),
});

export const ReviewProfileSchema = z.object({
  status: z.number().int().refine((v) => v === 1 || v === 2, { message: "状态必须是 1(通过) 或 2(驳回)" }),
  rejectReason: z.string().max(200).optional(),
});

export type SubmitProfileReviewDTO = z.infer<typeof SubmitProfileReviewSchema>;
export type ReviewProfileDTO = z.infer<typeof ReviewProfileSchema>;
