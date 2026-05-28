import { z } from "zod";

const imageUrl = z.string().refine(
  (v) => v.startsWith("/") || /^https?:\/\//.test(v),
  { message: "Must be a URL or path starting with /" },
);

export const CreatePostSchema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  imageUrls: z.array(imageUrl).max(9).optional(),
});

export const UpdatePostSchema = z.object({
  categoryId: z.string().min(1).optional(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().min(1).optional(),
  imageUrls: z.array(imageUrl).max(9).optional(),
});

export const PostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
  categoryId: z.string().optional(),
  keyword: z.string().optional(),
  sort: z.enum(["latest", "hot"]).default("latest"),
  status: z.coerce.number().int().optional(),
});

export const MyPostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(50).default(20),
  status: z.coerce.number().int().optional(),
});

export type CreatePostDTO = z.infer<typeof CreatePostSchema>;
export type UpdatePostDTO = z.infer<typeof UpdatePostSchema>;
export type PostListQueryDTO = z.infer<typeof PostListQuerySchema>;
export type MyPostListQueryDTO = z.infer<typeof MyPostListQuerySchema>;
