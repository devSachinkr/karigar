import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ensureDatabaseUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const primaryEmail =
    clerkUser.emailAddresses.find(email => email.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) {
    throw new Error("Your Clerk account needs a verified email address before Karigar can save your account.");
  }

  const name = clerkUser.fullName?.trim() || [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  return prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email: primaryEmail,
      profile: { create: { name, avatar: clerkUser.imageUrl } },
    },
    update: {
      email: primaryEmail,
      profile: {
        upsert: {
          create: { name, avatar: clerkUser.imageUrl },
          update: { name, avatar: clerkUser.imageUrl },
        },
      },
    },
  });
}
