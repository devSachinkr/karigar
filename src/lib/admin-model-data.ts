import { Prisma } from "@prisma/client";
import { z } from "zod";
import { adminModelKeys, type AdminModelKey } from "@/lib/admin-models";
import { prisma } from "@/lib/prisma";

type ListOptions = {
  search: string;
  skip: number;
  take: number;
};

type ModelPage = {
  rows: unknown[];
  total: number;
};

type ModelHandler = {
  count: () => Promise<number>;
  list: (options: ListOptions) => Promise<ModelPage>;
  create: (input: unknown) => Promise<unknown>;
  update: (id: string, input: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
};

const requiredText = z.string().trim().min(1);
const email = z.string().trim().email();
const optionalText = z.preprocess(
  value => (value === "" ? null : value),
  z.string().nullable().optional(),
);
const optionalNumber = z.preprocess(
  value => (value === "" ? null : value),
  z.number().finite().nullable().optional(),
);

function isNestedJsonValue(value: unknown): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isNestedJsonValue);
  if (typeof value === "object") {
    return Object.values(value).every(isNestedJsonValue);
  }
  return false;
}

const jsonValue = z.custom<Prisma.InputJsonValue>(
  value => value !== null && isNestedJsonValue(value),
  "Enter a valid JSON object or array.",
);

const schemas = {
  AdminActivity: z.object({
    action: requiredText,
    details: jsonValue.optional(),
  }),
  ChatConversation: z.object({
    userId: requiredText,
    title: requiredText.optional(),
  }),
  ChatMessage: z.object({
    conversationId: requiredText,
    role: z.enum(["user", "assistant"]),
    content: requiredText,
  }),
  Favorite: z.object({
    userId: requiredText,
    handicraftId: requiredText,
  }),
  GIInformation: z.object({
    handicraftId: requiredText,
    status: requiredText.optional(),
    registration: optionalText,
    origin: optionalText,
    history: optionalText,
    sourceUrl: optionalText,
  }),
  Handicraft: z.object({
    slug: requiredText,
    name: requiredText,
    description: optionalText,
    state: optionalText,
    region: optionalText,
    categoryId: requiredText,
  }),
  HandicraftCategory: z.object({
    name: requiredText,
  }),
  ImageEmbedding: z.object({
    referenceId: requiredText,
    vector: jsonValue,
    modelName: requiredText,
  }),
  ReferenceImage: z.object({
    handicraftId: requiredText,
    url: requiredText,
    description: optionalText,
    sourceUrl: optionalText,
    verified: z.boolean().optional(),
  }),
  Scan: z.object({
    userId: optionalText,
    imageUrl: requiredText,
    status: requiredText,
    category: optionalText,
    score: optionalNumber,
  }),
  ScanFeedback: z.object({
    scanId: requiredText,
    rating: z.enum(["HELPFUL", "NOT_HELPFUL"]),
    comment: optionalText,
  }),
  ScanResult: z.object({
    scanId: requiredText,
    result: jsonValue,
  }),
  User: z.object({
    clerkId: requiredText,
    email,
    role: z.enum(["USER", "ADMIN"]).optional(),
  }),
  UserProfile: z.object({
    userId: requiredText,
    name: optionalText,
    avatar: optionalText,
  }),
} satisfies Record<AdminModelKey, z.ZodObject<z.ZodRawShape>>;

function updateSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema.partial().refine(value => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });
}

const updateSchemas = {
  AdminActivity: updateSchema(schemas.AdminActivity),
  ChatConversation: updateSchema(schemas.ChatConversation),
  ChatMessage: updateSchema(schemas.ChatMessage),
  Favorite: updateSchema(schemas.Favorite),
  GIInformation: updateSchema(schemas.GIInformation),
  Handicraft: updateSchema(schemas.Handicraft),
  HandicraftCategory: updateSchema(schemas.HandicraftCategory),
  ImageEmbedding: updateSchema(schemas.ImageEmbedding),
  ReferenceImage: updateSchema(schemas.ReferenceImage),
  Scan: updateSchema(schemas.Scan),
  ScanFeedback: updateSchema(schemas.ScanFeedback),
  ScanResult: updateSchema(schemas.ScanResult),
  User: updateSchema(schemas.User),
  UserProfile: updateSchema(schemas.UserProfile),
};

const contains = (value: string) => ({
  contains: value,
  mode: "insensitive" as const,
});

async function pageRows<T>(
  findMany: () => Promise<T[]>,
  count: () => Promise<number>,
): Promise<ModelPage> {
  const [rows, total] = await Promise.all([findMany(), count()]);
  return { rows, total };
}

const handlers: Record<AdminModelKey, ModelHandler> = {
  AdminActivity: {
    count: () => prisma.adminActivity.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.AdminActivityWhereInput = search
        ? { action: contains(search) }
        : {};
      return pageRows(
        () =>
          prisma.adminActivity.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.adminActivity.count({ where }),
      );
    },
    create: input =>
      prisma.adminActivity.create({ data: schemas.AdminActivity.parse(input) }),
    update: (id, input) =>
      prisma.adminActivity.update({
        where: { id },
        data: updateSchemas.AdminActivity.parse(input),
      }),
    delete: id => prisma.adminActivity.delete({ where: { id } }),
  },
  ChatConversation: {
    count: () => prisma.chatConversation.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ChatConversationWhereInput = search
        ? {
            OR: [
              { title: contains(search) },
              { userId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.chatConversation.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.chatConversation.count({ where }),
      );
    },
    create: input =>
      prisma.chatConversation.create({
        data: schemas.ChatConversation.parse(input),
      }),
    update: (id, input) =>
      prisma.chatConversation.update({
        where: { id },
        data: updateSchemas.ChatConversation.parse(input),
      }),
    delete: id => prisma.chatConversation.delete({ where: { id } }),
  },
  ChatMessage: {
    count: () => prisma.chatMessage.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ChatMessageWhereInput = search
        ? {
            OR: [
              { content: contains(search) },
              { role: contains(search) },
              { conversationId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.chatMessage.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.chatMessage.count({ where }),
      );
    },
    create: input =>
      prisma.chatMessage.create({ data: schemas.ChatMessage.parse(input) }),
    update: (id, input) =>
      prisma.chatMessage.update({
        where: { id },
        data: updateSchemas.ChatMessage.parse(input),
      }),
    delete: id => prisma.chatMessage.delete({ where: { id } }),
  },
  Favorite: {
    count: () => prisma.favorite.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.FavoriteWhereInput = search
        ? {
            OR: [
              { userId: contains(search) },
              { handicraftId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.favorite.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
          }),
        () => prisma.favorite.count({ where }),
      );
    },
    create: input => prisma.favorite.create({ data: schemas.Favorite.parse(input) }),
    update: (id, input) =>
      prisma.favorite.update({
        where: { id },
        data: updateSchemas.Favorite.parse(input),
      }),
    delete: id => prisma.favorite.delete({ where: { id } }),
  },
  GIInformation: {
    count: () => prisma.gIInformation.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.GIInformationWhereInput = search
        ? {
            OR: [
              { status: contains(search) },
              { registration: contains(search) },
              { origin: contains(search) },
              { history: contains(search) },
              { sourceUrl: contains(search) },
              { handicraftId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.gIInformation.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
          }),
        () => prisma.gIInformation.count({ where }),
      );
    },
    create: input =>
      prisma.gIInformation.create({ data: schemas.GIInformation.parse(input) }),
    update: (id, input) =>
      prisma.gIInformation.update({
        where: { id },
        data: updateSchemas.GIInformation.parse(input),
      }),
    delete: id => prisma.gIInformation.delete({ where: { id } }),
  },
  Handicraft: {
    count: () => prisma.handicraft.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.HandicraftWhereInput = search
        ? {
            OR: [
              { slug: contains(search) },
              { name: contains(search) },
              { description: contains(search) },
              { state: contains(search) },
              { region: contains(search) },
              { categoryId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.handicraft.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.handicraft.count({ where }),
      );
    },
    create: input =>
      prisma.handicraft.create({ data: schemas.Handicraft.parse(input) }),
    update: (id, input) =>
      prisma.handicraft.update({
        where: { id },
        data: updateSchemas.Handicraft.parse(input),
      }),
    delete: id => prisma.handicraft.delete({ where: { id } }),
  },
  HandicraftCategory: {
    count: () => prisma.handicraftCategory.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.HandicraftCategoryWhereInput = search
        ? { name: contains(search) }
        : {};
      return pageRows(
        () =>
          prisma.handicraftCategory.findMany({
            where,
            skip,
            take,
            orderBy: { name: "asc" },
          }),
        () => prisma.handicraftCategory.count({ where }),
      );
    },
    create: input =>
      prisma.handicraftCategory.create({
        data: schemas.HandicraftCategory.parse(input),
      }),
    update: (id, input) =>
      prisma.handicraftCategory.update({
        where: { id },
        data: updateSchemas.HandicraftCategory.parse(input),
      }),
    delete: id => prisma.handicraftCategory.delete({ where: { id } }),
  },
  ImageEmbedding: {
    count: () => prisma.imageEmbedding.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ImageEmbeddingWhereInput = search
        ? {
            OR: [
              { modelName: contains(search) },
              { referenceId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.imageEmbedding.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
          }),
        () => prisma.imageEmbedding.count({ where }),
      );
    },
    create: input =>
      prisma.imageEmbedding.create({
        data: schemas.ImageEmbedding.parse(input),
      }),
    update: (id, input) =>
      prisma.imageEmbedding.update({
        where: { id },
        data: updateSchemas.ImageEmbedding.parse(input),
      }),
    delete: id => prisma.imageEmbedding.delete({ where: { id } }),
  },
  ReferenceImage: {
    count: () => prisma.referenceImage.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ReferenceImageWhereInput = search
        ? {
            OR: [
              { url: contains(search) },
              { description: contains(search) },
              { sourceUrl: contains(search) },
              { handicraftId: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.referenceImage.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.referenceImage.count({ where }),
      );
    },
    create: input =>
      prisma.referenceImage.create({
        data: schemas.ReferenceImage.parse(input),
      }),
    update: (id, input) =>
      prisma.referenceImage.update({
        where: { id },
        data: updateSchemas.ReferenceImage.parse(input),
      }),
    delete: id => prisma.referenceImage.delete({ where: { id } }),
  },
  Scan: {
    count: () => prisma.scan.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ScanWhereInput = search
        ? {
            OR: [
              { userId: contains(search) },
              { imageUrl: contains(search) },
              { status: contains(search) },
              { category: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.scan.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.scan.count({ where }),
      );
    },
    create: input => prisma.scan.create({ data: schemas.Scan.parse(input) }),
    update: (id, input) =>
      prisma.scan.update({
        where: { id },
        data: updateSchemas.Scan.parse(input),
      }),
    delete: id => prisma.scan.delete({ where: { id } }),
  },
  ScanFeedback: {
    count: () => prisma.scanFeedback.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ScanFeedbackWhereInput = search
        ? {
            OR: [
              { scanId: contains(search) },
              { rating: contains(search) },
              { comment: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.scanFeedback.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
          }),
        () => prisma.scanFeedback.count({ where }),
      );
    },
    create: input =>
      prisma.scanFeedback.create({ data: schemas.ScanFeedback.parse(input) }),
    update: (id, input) =>
      prisma.scanFeedback.update({
        where: { id },
        data: updateSchemas.ScanFeedback.parse(input),
      }),
    delete: id => prisma.scanFeedback.delete({ where: { id } }),
  },
  ScanResult: {
    count: () => prisma.scanResult.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.ScanResultWhereInput = search
        ? { scanId: contains(search) }
        : {};
      return pageRows(
        () =>
          prisma.scanResult.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
          }),
        () => prisma.scanResult.count({ where }),
      );
    },
    create: input =>
      prisma.scanResult.create({ data: schemas.ScanResult.parse(input) }),
    update: (id, input) =>
      prisma.scanResult.update({
        where: { id },
        data: updateSchemas.ScanResult.parse(input),
      }),
    delete: id => prisma.scanResult.delete({ where: { id } }),
  },
  User: {
    count: () => prisma.user.count(),
    list: ({ search, skip, take }) => {
      const conditions: Prisma.UserWhereInput[] = search
        ? [{ email: contains(search) }, { clerkId: contains(search) }]
        : [];
      if (search.toUpperCase() === "USER") conditions.push({ role: "USER" });
      if (search.toUpperCase() === "ADMIN") conditions.push({ role: "ADMIN" });
      const where: Prisma.UserWhereInput = search ? { OR: conditions } : {};
      return pageRows(
        () =>
          prisma.user.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        () => prisma.user.count({ where }),
      );
    },
    create: input => prisma.user.create({ data: schemas.User.parse(input) }),
    update: (id, input) =>
      prisma.user.update({
        where: { id },
        data: updateSchemas.User.parse(input),
      }),
    delete: id => prisma.user.delete({ where: { id } }),
  },
  UserProfile: {
    count: () => prisma.userProfile.count(),
    list: ({ search, skip, take }) => {
      const where: Prisma.UserProfileWhereInput = search
        ? {
            OR: [
              { userId: contains(search) },
              { name: contains(search) },
              { avatar: contains(search) },
            ],
          }
        : {};
      return pageRows(
        () =>
          prisma.userProfile.findMany({
            where,
            skip,
            take,
            orderBy: { id: "desc" },
          }),
        () => prisma.userProfile.count({ where }),
      );
    },
    create: input =>
      prisma.userProfile.create({ data: schemas.UserProfile.parse(input) }),
    update: (id, input) =>
      prisma.userProfile.update({
        where: { id },
        data: updateSchemas.UserProfile.parse(input),
      }),
    delete: id => prisma.userProfile.delete({ where: { id } }),
  },
};

export function isAdminModelKey(value: string): value is AdminModelKey {
  return adminModelKeys.some(key => key === value);
}

export async function getAdminModelCounts() {
  return Promise.all(
    adminModelKeys.map(async key => ({
      key,
      count: await handlers[key].count(),
    })),
  );
}

export function getAdminModelHandler(key: AdminModelKey): ModelHandler {
  return handlers[key];
}
