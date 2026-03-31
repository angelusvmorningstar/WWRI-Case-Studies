// Mock auth for local development without Azure AD
// Replace with real Auth.js when deploying for IEs

import { prisma } from "@/lib/db";
import type { User } from "@/app/generated/prisma/client";

export type { User };

// Returns the admin user (Angelus) for demo purposes
// In production, this would come from the Auth.js session
export async function getCurrentUser(): Promise<User> {
  const user = await prisma.user.findFirst({
    where: { email: "angelus@whitewater.com" },
  });
  if (!user) throw new Error("Admin user not found — run prisma db seed");
  return user;
}

export async function getAllUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: { name: "asc" } });
}
