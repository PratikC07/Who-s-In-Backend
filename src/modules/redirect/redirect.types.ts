import { z } from "zod";

export const redirectParamsInput = z.object({
  shareCode: z.string().min(1, "Share code is required"),
});

export const redirectParamsSchema = z.object({
  params: redirectParamsInput,
});

export type RedirectParamsInput = z.infer<typeof redirectParamsInput>;
