import { PrismaClient } from "@prisma/client";
import { BadRequestError } from "../utils/errors";

const prisma = new PrismaClient();

interface ClerkUserData {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export class ClerkUserService {
  static async syncUserWithClerk(clerkData: ClerkUserData) {
    try {
      const { clerkUserId, email, firstName, lastName, username } = clerkData;

      let user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });

      if (user) {
        user = await prisma.user.update({
          where: { clerkId: clerkUserId },
          data: {
            email,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            username: username || user.username,
            lastLogin: new Date(),
          },
        });

        return user;
      }
      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmailUser) {
        user = await prisma.user.update({
          where: { email },
          data: {
            clerkId: clerkUserId,
            firstName: firstName || existingEmailUser.firstName,
            lastName: lastName || existingEmailUser.lastName,
            lastLogin: new Date(),
          },
        });

        return user;
      }

      let finalUsername = username || `user_${clerkUserId.slice(-8)}`;

      let counter = 1;
      while (await this.usernameExists(finalUsername)) {
        finalUsername = `${username || "user"}_${clerkUserId.slice(
          -8
        )}_${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email,
          username: finalUsername,
          firstName: firstName || "",
          lastName: lastName || "",
          password: "",
          level: 1,
          xp: 0,
          streak: 0,
          lastLogin: new Date(),
        },
      });

      return user;
    } catch (error) {
      console.error("Error syncing user with Clerk:", error);
      throw new BadRequestError("Failed to sync user with Clerk");
    }
  }

  private static async usernameExists(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
    });
    return !!user;
  }
}
