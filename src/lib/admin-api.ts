import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ensureDatabaseUser } from "@/lib/database-user";
import { prisma } from "@/lib/prisma";

type AdminUser = NonNullable<Awaited<ReturnType<typeof ensureDatabaseUser>>>;

type AdminApiAccess =
  | { user: AdminUser; response: null }
  | { user: null; response: NextResponse };

export async function requireAdminApiAccess(): Promise<AdminApiAccess> {
  const user = await ensureDatabaseUser();
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  if (user.role !== "ADMIN") {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Administrator access required." },
        { status: 403 },
      ),
    };
  }
  return { user, response: null };
}

export async function recordAdminMutation(
  actorId: string,
  model: string,
  action: string,
  recordId: string | null,
): Promise<string | null> {
  try {
    await prisma.adminActivity.create({
      data: {
        action: `${action}_${model}`,
        details: { actorId, model, recordId },
      },
    });
    return null;
  } catch (error) {
    console.error("Could not record admin data change", error);
    return "The record was changed, but its audit event could not be saved.";
  }
}

export function adminApiError(error: unknown, operation: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: "The submitted data is invalid.",
        issues: error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
    if (
      error.code === "P2002" ||
      error.code === "P2003" ||
      error.code === "P2014"
    ) {
      return NextResponse.json(
        {
          error:
            "The change conflicts with a unique value or related record. Check the linked IDs and try again.",
        },
        { status: 409 },
      );
    }
  }

  console.error(`Admin data ${operation} failed`, error);
  return NextResponse.json(
    { error: `Could not ${operation} this record.` },
    { status: 500 },
  );
}

export async function readAdminJson(request: Request) {
  try {
    return { value: (await request.json()) as unknown, response: null };
  } catch {
    return {
      value: null,
      response: NextResponse.json(
        { error: "Request body must contain valid JSON." },
        { status: 400 },
      ),
    };
  }
}
