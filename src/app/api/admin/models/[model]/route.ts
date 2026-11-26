import { NextResponse } from "next/server";
import { adminApiError, readAdminJson, recordAdminMutation, requireAdminApiAccess } from "@/lib/admin-api";
import { getAdminModelHandler, isAdminModelKey } from "@/lib/admin-model-data";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ model: string }> };

async function getModelHandler(modelName: string) {
  if (!isAdminModelKey(modelName)) return null;
  return getAdminModelHandler(modelName);
}

function getId(record: unknown): string | null {
  if (
    typeof record === "object" &&
    record !== null &&
    "id" in record &&
    typeof record.id === "string"
  ) {
    return record.id;
  }
  return null;
}

function invalidModelResponse() {
  return NextResponse.json({ error: "Unknown admin model." }, { status: 404 });
}

function userMutationConflictResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 409 });
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const access = await requireAdminApiAccess();
    if (access.response) return access.response;

    const { model } = await params;
    const handler = await getModelHandler(model);
    if (!handler) return invalidModelResponse();

    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "25");
    const search = (url.searchParams.get("search") || "").trim();
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      search.length > 100
    ) {
      return NextResponse.json(
        { error: "Invalid page, page size, or search query." },
        { status: 400 },
      );
    }

    const result = await handler.list({
      search,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return NextResponse.json({ model, page, pageSize, ...result });
  } catch (error) {
    return adminApiError(error, "list admin records");
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const access = await requireAdminApiAccess();
    if (access.response) return access.response;

    const { model } = await params;
    const handler = await getModelHandler(model);
    if (!handler) return invalidModelResponse();

    const body = await readAdminJson(request);
    if (body.response) return body.response;
    const record = await handler.create(body.value);
    const auditWarning = await recordAdminMutation(
      access.user.id,
      model,
      "CREATE",
      getId(record),
    );
    return NextResponse.json({ record, warning: auditWarning }, { status: 201 });
  } catch (error) {
    return adminApiError(error, "create");
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const access = await requireAdminApiAccess();
    if (access.response) return access.response;

    const { model } = await params;
    const handler = await getModelHandler(model);
    if (!handler) return invalidModelResponse();

    const body = await readAdminJson(request);
    if (body.response) return body.response;
    if (
      !body.value ||
      typeof body.value !== "object" ||
      !("id" in body.value) ||
      typeof body.value.id !== "string" ||
      !("data" in body.value)
    ) {
      return NextResponse.json(
        { error: "An id and update data are required." },
        { status: 400 },
      );
    }
    const { id, data } = body.value as { id: string; data: unknown };

    if (model === "User") {
      const target = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, clerkId: true },
      });
      if (target?.id === access.user.id && data && typeof data === "object") {
        if ("role" in data && data.role === "USER") {
          return userMutationConflictResponse(
            "You cannot remove your own administrator role.",
          );
        }
        if ("clerkId" in data && data.clerkId !== target.clerkId) {
          return userMutationConflictResponse(
            "You cannot change your own Clerk user ID.",
          );
        }
      }
      if (
        target?.role === "ADMIN" &&
        data &&
        typeof data === "object" &&
        "role" in data &&
        data.role === "USER" &&
        (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1
      ) {
        return userMutationConflictResponse(
          "At least one administrator account must remain.",
        );
      }
    }

    const record = await handler.update(id, data);
    const auditWarning = await recordAdminMutation(
      access.user.id,
      model,
      "UPDATE",
      id,
    );
    return NextResponse.json({ record, warning: auditWarning });
  } catch (error) {
    return adminApiError(error, "update");
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const access = await requireAdminApiAccess();
    if (access.response) return access.response;

    const { model } = await params;
    const handler = await getModelHandler(model);
    if (!handler) return invalidModelResponse();

    const body = await readAdminJson(request);
    if (body.response) return body.response;
    if (
      !body.value ||
      typeof body.value !== "object" ||
      !("id" in body.value) ||
      typeof body.value.id !== "string"
    ) {
      return NextResponse.json(
        { error: "An id is required." },
        { status: 400 },
      );
    }
    const { id } = body.value as { id: string };

    if (model === "User") {
      if (id === access.user.id) {
        return userMutationConflictResponse(
          "You cannot delete your own administrator account.",
        );
      }
      const target = await prisma.user.findUnique({
        where: { id },
        select: { role: true },
      });
      if (
        target?.role === "ADMIN" &&
        (await prisma.user.count({ where: { role: "ADMIN" } })) <= 1
      ) {
        return userMutationConflictResponse(
          "At least one administrator account must remain.",
        );
      }
    }

    await handler.delete(id);
    const auditWarning = await recordAdminMutation(
      access.user.id,
      model,
      "DELETE",
      id,
    );
    return NextResponse.json({ deleted: true, warning: auditWarning });
  } catch (error) {
    return adminApiError(error, "delete");
  }
}
