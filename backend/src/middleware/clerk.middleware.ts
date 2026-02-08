import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/clerk-sdk-node";
import type { User } from "@clerk/clerk-sdk-node";

export interface ClerkRequest extends Request {
  clerkUserId?: string;
  clerkUser?: User;
}

export const verifyClerkToken = async (
  req: ClerkRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "No Clerk token provided",
      });
      return;
    }

    const sessionToken = await clerkClient.verifyToken(token);

    if (!sessionToken) {
      res.status(401).json({
        success: false,
        message: "Invalid Clerk token",
      });
      return;
    }

    const clerkUser = await clerkClient.users.getUser(sessionToken.sub);

    req.clerkUserId = sessionToken.sub;
    req.clerkUser = clerkUser;

    next();
  } catch (error) {
    console.error("Clerk token verification failed:", error);
    res.status(401).json({
      success: false,
      message: "Clerk token verification failed",
    });
    return;
  }
};
