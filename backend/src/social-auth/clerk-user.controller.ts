import { Response, NextFunction } from "express";
import { ClerkRequest } from "../middleware/clerk.middleware";
import { ClerkUserService } from "../social-auth/clerk-user.service";
import * as userService from "../modules/user/user.service";

const ACCESS_COOKIE_MS = 15 * 60 * 1000; // 15 min
const REFRESH_COOKIE_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage
const prod = process.env.NODE_ENV === "production";

const cookieBase = {
  httpOnly: true,
  secure: prod,
  sameSite: prod ? "none" : "lax",
  path: "/",
} as const;

const setCookies = (res: Response, access: string, refresh?: string) => {
  res.cookie("token", access, { ...cookieBase, maxAge: ACCESS_COOKIE_MS });
  if (refresh)
    res.cookie("refreshToken", refresh, {
      ...cookieBase,
      maxAge: REFRESH_COOKIE_MS,
    });
};

export const syncClerkUser = async (
  req: ClerkRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  //
  try {
    const { clerkUserId, email, firstName, lastName, username } = req.body;

    if (!clerkUserId || !email) {
      res.status(400).json({
        success: false,
        message: "Clerk User ID and email are required",
      });
      return;
    }

    const user = await ClerkUserService.syncUserWithClerk({
      clerkUserId,
      email,
      firstName,
      lastName,
      username,
    });

    const { token, refreshToken } = await userService.createSessionTokens(
      user.id
    );
    setCookies(res, token, refreshToken);

    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
    });
  } catch (error) {
    next(error);
  }
};
