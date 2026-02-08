import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { UnauthorizedError } from "./errors";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const comparePassword = (plain: string, hashed: string) =>
  bcrypt.compare(plain, hashed);

export const generateToken = (userId: string, expiresIn = JWT_EXPIRES_IN) =>
  jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn } as SignOptions);

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const generateRefreshToken = (id: string) => uuidv4();
