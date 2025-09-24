import { nanoid } from "nanoid";
import prisma from "../lib/prisma.js";

export const generateUniqueShareCode = async (): Promise<string> => {
  let shareCode: string;
  let isUnique = false;

  do {
    shareCode = nanoid(8);
    const existingPoll = await prisma.poll.findUnique({
      where: {
        shareCode,
      },
    });
    if (!existingPoll) {
      isUnique = true;
    }
  } while (!isUnique);

  return shareCode;
};
