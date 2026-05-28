import { z } from "zod";

export const UpdateProfileSchema = z.object({
  nickname: z.string().min(1).max(64).optional(),
  avatar: z.string().max(512).refine(
    (v) => !v || v.startsWith("/") || /^https?:\/\//.test(v),
    { message: "Must be a URL or path starting with /" },
  ).optional(),
  bio: z.string().max(200).optional(),
  gender: z.number().int().min(0).max(2).optional(),
  age: z.number().int().min(1).max(150).optional(),
  showGender: z.number().int().min(0).max(1).optional(),
  showAge: z.number().int().min(0).max(1).optional(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;
