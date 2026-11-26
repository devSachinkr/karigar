import { connection, NextResponse } from "next/server";
import { adminApiError, requireAdminApiAccess } from "@/lib/admin-api";
import { getAdminModelCounts } from "@/lib/admin-model-data";
import { adminModelDefinitions } from "@/lib/admin-models";

export async function GET() {
  await connection();
  try {
    const access = await requireAdminApiAccess();
    if (access.response) return access.response;

    const counts = await getAdminModelCounts();
    const models = adminModelDefinitions.map(definition => ({
      ...definition,
      count: counts.find(item => item.key === definition.key)?.count ?? 0,
    }));
    return NextResponse.json({ models });
  } catch (error) {
    return adminApiError(error, "load admin models");
  }
}
