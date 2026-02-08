import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { verifyToken } from "../utils/security";
import * as userService from "../modules/user/user.service";

export interface AuthRequest extends Request {
  user?: Awaited<ReturnType<typeof userService.getUserById>> & {
    role?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies?.token;

    console.log("Received token:", token);

    if (!token) {throw new UnauthorizedError("No access token");}

    const decoded = verifyToken(token);

    const user = await userService.getUserById(decoded.sub as string);
    if (!user) {throw new UnauthorizedError("User not found");}

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : req.cookies?.token;

  if (!token) {return next();}

  try {
    const decoded = verifyToken(token);
    req.user = await userService.getUserById(decoded.sub as string);
  } catch(error) {console.debug('Optional auth failed:', error instanceof Error ? error.message : 'Unknown error');}
  next();
};

export const checkRole =
  (roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {return next(new UnauthorizedError());}
    const role = req.user.role ?? "user";
    if (!roles.includes(role))
      {return next(new ForbiddenError("Insufficient permissions"));}
    next();
  };
