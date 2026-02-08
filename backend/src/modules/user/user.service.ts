import prisma from "../../lib/prisma";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../utils/errors";
import {
  comparePassword,
  generateRefreshToken,
  generateToken,
  hashPassword,
} from "../../utils/security";

const REFRESH_DAYS = 30;

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");
  return user;
};

export const registerUser = async (data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}) => {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new ConflictError("E-mail already in use");

  const username = data.username || data.email.split("@")[0];

  const user = await prisma.user.create({
    data: { ...data, username, password: await hashPassword(data.password) },
  });

  const token = generateToken(user.id);
  const refreshToken = await storeRefreshToken(user.id);

  return { user, token, refreshToken };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedError("Invalid credentials");
  if (!(await comparePassword(password, user.password)))
    throw new UnauthorizedError("Invalid credentials");

  const token = generateToken(user.id);
  const refreshToken = await storeRefreshToken(user.id);

  return { user, token, refreshToken };
};

export const refreshAccessToken = async (refreshToken: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });
  if (!stored || stored.expiresAt < new Date())
    throw new UnauthorizedError("Refresh token invalid");

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) throw new NotFoundError("User not found");

  const token = generateToken(user.id);
  return { token, user };
};

export const logoutUser = (refreshToken: string) =>
  prisma.refreshToken.deleteMany({ where: { token: refreshToken } });

export const createSessionTokens = async (userId: string) => {
  const token = generateToken(userId);
  const refreshToken = await storeRefreshToken(userId);
  return { token, refreshToken };
};

const storeRefreshToken = async (userId: string) => {
  const refreshToken = generateRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return refreshToken;
};

export const rotateRefreshToken = async (oldToken: string) => {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldToken },
  });
  if (!stored || stored.expiresAt < new Date())
    throw new UnauthorizedError("Refresh-Token ungültig");
  await prisma.refreshToken.delete({ where: { token: oldToken } });

  const accessToken = generateToken(stored.userId);
  const refreshToken = await storeRefreshToken(stored.userId);

  return { accessToken, refreshToken };
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const createSocialUser = async (data: {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}) => {
  return await prisma.user.create({
    data: {
      ...data,
      password: "",
    },
  });
};

export const updateUserLastLogin = async (userId: string) => {
  return await prisma.user.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });
};

export const createSocialUserAlt = async (data: {
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
}) => {
  return await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      password: "",
    },
  });
};

export const getLeaderboard = async (limit = 10) => {
  return await prisma.user.findMany({
    orderBy: {
      xp: "desc",
    },
    take: limit,
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      level: true,
      xp: true,
    },
  });
};
