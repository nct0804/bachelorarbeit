import { Request, Response, NextFunction } from "express";
import * as userService from "./user.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { BadRequestError } from "../../utils/errors";

const ACCESS_COOKIE_MS = 15 * 60 * 1000; // 15 min
const REFRESH_COOKIE_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage
const prod = process.env.NODE_ENV === "production";

const cookieBase = {
  httpOnly: true,
  secure: prod, // nur über HTTPS in Prod
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

const clearCookies = (res: Response) => {
  res.clearCookie("token", cookieBase);
  res.clearCookie("refreshToken", cookieBase);
};

const stripPw = <T extends { password?: unknown }>(u: T) => ({
  ...u,
  password: undefined,
});

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user, token, refreshToken } = await userService.registerUser(
      req.body
    );
    setCookies(res, token, refreshToken);

    res.status(201).json({
      success: true,
      data: { user: stripPw(user) }, // Tokens NICHT mehr mitgeben
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new BadRequestError("E-Mail + Passwort erforderlich");

    const { user, token, refreshToken } = await userService.loginUser(
      email,
      password
    );
    setCookies(res, token, refreshToken);

    res.json({ success: true, data: { user: stripPw(user) } });
  } catch (err) {
    next(err);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await userService.logoutUser(req.cookies.refreshToken);
    clearCookies(res);
    res.json({ success: true, message: "Ausgeloggt" });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({ success: true, data: { user: stripPw(req.user!) } });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const oldRefresh = req.cookies.refreshToken;
    if (!oldRefresh) throw new BadRequestError("Kein Refresh-Token");

    const { accessToken, refreshToken } = await userService.rotateRefreshToken(
      oldRefresh
    );

    setCookies(res, accessToken, refreshToken);
    res.json({ success: true, message: "Token erneuert" });
  } catch (err) {
    next(err);
  }
};

export const getLeaderboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const leaderboard = await userService.getLeaderboard(limit);
    res.json({ success: true, data: leaderboard });
  } catch (err) {
    next(err);
  }
};
