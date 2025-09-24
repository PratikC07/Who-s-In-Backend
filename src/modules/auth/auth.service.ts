import bcrypt from "bcryptjs";
import type { LoginSchema, RegisterSchema } from "./auth.types.js";
import prisma from "../../lib/prisma.js";
import type { User } from "../../generated/prisma/index.js";
import jwt from "jsonwebtoken";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";

export const registerUser = async (
  input: RegisterSchema
): Promise<{ token: string; user: Omit<User, "password"> }> => {
  const { email, password, name } = input;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // 👇 Throw a specific, semantic error
    throw new ConflictError("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  const accessToken = jwt.sign(
    { userId: newUser.id },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1d",
    }
  );

  const { password: _, ...userWithoutPassword } = newUser;

  return {
    token: accessToken,
    user: userWithoutPassword,
  };
};

export const loginUser = async (
  input: LoginSchema
): Promise<{ token: string; user: Omit<User, "password"> }> => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    // 👇 Throw a specific, semantic error
    throw new UnauthorizedError("Invalid email or password");
  }

  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "1d",
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    token: accessToken,
    user: userWithoutPassword,
  };
};
