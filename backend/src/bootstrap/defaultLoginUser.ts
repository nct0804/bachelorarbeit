import prisma from "../lib/prisma";
import { hashPassword } from "../utils/security";

type DefaultLoginUserConfig = {
  enabled: boolean;
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
};

const asBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const getDefaultLoginUserConfig = (): DefaultLoginUserConfig => {
  const enabled = asBoolean(
    process.env.DEFAULT_LOGIN_ENABLED,
    process.env.NODE_ENV !== "production"
  );

  return {
    enabled,
    email: process.env.DEFAULT_LOGIN_EMAIL || "demo@germangains.com",
    password: process.env.DEFAULT_LOGIN_PASSWORD || "password123",
    username: process.env.DEFAULT_LOGIN_USERNAME || "demouser",
    firstName: process.env.DEFAULT_LOGIN_FIRST_NAME || "Demo",
    lastName: process.env.DEFAULT_LOGIN_LAST_NAME || "User",
  };
};

const resolveAvailableUsername = async (baseUsername: string, email: string) => {
  const normalizedBase = baseUsername.trim().toLowerCase() || "defaultuser";

  const baseOwner = await prisma.user.findUnique({
    where: { username: normalizedBase },
    select: { email: true },
  });
  if (!baseOwner || baseOwner.email === email) {
    return normalizedBase;
  }

  for (let index = 1; index <= 100; index += 1) {
    const candidate = `${normalizedBase}_${index}`;
    const owner = await prisma.user.findUnique({
      where: { username: candidate },
      select: { email: true },
    });
    if (!owner || owner.email === email) {
      return candidate;
    }
  }

  const uniqueSuffix = Date.now().toString().slice(-6);
  return `${normalizedBase}_${uniqueSuffix}`;
};

export const ensureDefaultLoginUser = async () => {
  const config = getDefaultLoginUserConfig();

  if (!config.enabled) {
    console.log("Default login user bootstrap disabled.");
    return;
  }

  const hashedPassword = await hashPassword(config.password);
  const existing = await prisma.user.findUnique({ where: { email: config.email } });

  if (existing) {
    await prisma.user.update({
      where: { email: config.email },
      data: {
        password: hashedPassword,
        firstName: config.firstName,
        lastName: config.lastName,
      },
    });
    console.log(`Default login user refreshed: ${config.email}`);
    return;
  }

  const username = await resolveAvailableUsername(config.username, config.email);
  await prisma.user.create({
    data: {
      email: config.email,
      username,
      password: hashedPassword,
      firstName: config.firstName,
      lastName: config.lastName,
    },
  });

  console.log(`Default login user created: ${config.email}`);
};
