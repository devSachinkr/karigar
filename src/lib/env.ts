import { z } from "zod";

const publicEnvSchema=z.object({
  NEXT_PUBLIC_APP_URL:z.string().url().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:z.string().optional(),
});

export function getPublicEnv(){
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL:process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });
}
