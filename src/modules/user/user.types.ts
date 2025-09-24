import { z } from "zod";

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must be at least 3 characters" })
    .optional(),
});

export const updateUserBodySchema = z.object({
  body: updateUserSchema,
});

export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
