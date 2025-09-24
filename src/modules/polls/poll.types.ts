import { z } from "zod";

export const createPollSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  options: z
    .array(z.string().min(1, "Option can't be empty"))
    .min(2, "Must provide at least two options"),
});

export const createPollBodySchema = z.object({
  body: createPollSchema,
});

export const pollParamsSchema = z.object({
  params: z.object({
    pollId: z.string().uuid("Invalid poll ID"),
  }),
});

export const pollQuerySchema = z.object({
  query: z.object({
    token: z.string().min(1, "Token cannot be empty"),
  }),
});

export type CreatePollSchema = z.infer<typeof createPollSchema>;
export type PollParamsSchema = z.infer<typeof pollParamsSchema>;
