import { z } from "zod";

// Schema for requests that use a pollId in the URL params
export const pollParamsInput = z.object({
  pollId: z.string().uuid("Invalid poll ID format"),
});

export const pollParamsSchema = z.object({
  params: pollParamsInput,
});

export const submitVoteInput = z.object({
  optionId: z.string().uuid("Invalid option ID format"),
  voterName: z.string().min(3, "Voter name must be at least 3 characters long"),
});

export const submitSchema = z.object({
  body: submitVoteInput,
  params: pollParamsInput,
});

export type SubmitVoteInput = z.infer<typeof submitVoteInput>;
export type PollParamsInput = z.infer<typeof pollParamsInput>;
