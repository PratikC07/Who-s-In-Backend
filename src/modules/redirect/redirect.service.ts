import prisma from "../../lib/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export const findPollByShareCode = async (shareCode: string) => {
  const poll = await prisma.poll.findUnique({
    where: {
      shareCode,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!poll) {
    // 👇 Throw an error if the poll is not found
    throw new NotFoundError("Poll not found");
  }

  return poll;
};
