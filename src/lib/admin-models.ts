export const adminModelKeys = [
  "AdminActivity",
  "ChatConversation",
  "ChatMessage",
  "Favorite",
  "GIInformation",
  "Handicraft",
  "HandicraftCategory",
  "ImageEmbedding",
  "ReferenceImage",
  "Scan",
  "ScanFeedback",
  "ScanResult",
  "User",
  "UserProfile",
] as const;

export type AdminModelKey = (typeof adminModelKeys)[number];

export type AdminField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "json" | "select";
  required?: boolean;
  options?: string[];
  defaultValue?: string | boolean;
  help?: string;
};

export type AdminModelDefinition = {
  key: AdminModelKey;
  label: string;
  columns: string[];
  fields: AdminField[];
  help?: string;
};

export const adminModelDefinitions: AdminModelDefinition[] = [
  {
    key: "AdminActivity",
    label: "AdminActivity",
    columns: ["action", "createdAt"],
    fields: [
      { key: "action", label: "Action", type: "text", required: true },
      { key: "details", label: "Details (JSON)", type: "json" },
    ],
  },
  {
    key: "ChatConversation",
    label: "ChatConversation",
    columns: ["userId", "title", "createdAt"],
    fields: [
      {
        key: "userId",
        label: "User ID",
        type: "text",
        required: true,
        help: "References User.id.",
      },
      {
        key: "title",
        label: "Title",
        type: "text",
        required: true,
        defaultValue: "New conversation",
      },
    ],
  },
  {
    key: "ChatMessage",
    label: "ChatMessage",
    columns: ["conversationId", "role", "content", "createdAt"],
    fields: [
      {
        key: "conversationId",
        label: "Conversation ID",
        type: "text",
        required: true,
        help: "References ChatConversation.id.",
      },
      {
        key: "role",
        label: "Role",
        type: "select",
        required: true,
        options: ["user", "assistant"],
        defaultValue: "user",
      },
      { key: "content", label: "Content", type: "textarea", required: true },
    ],
  },
  {
    key: "Favorite",
    label: "Favorite",
    columns: ["userId", "handicraftId"],
    fields: [
      {
        key: "userId",
        label: "User ID",
        type: "text",
        required: true,
        help: "References User.id.",
      },
      {
        key: "handicraftId",
        label: "Handicraft ID",
        type: "text",
        required: true,
        help: "References Handicraft.id.",
      },
    ],
  },
  {
    key: "GIInformation",
    label: "GIInformation",
    columns: ["handicraftId", "status", "registration", "origin"],
    fields: [
      {
        key: "handicraftId",
        label: "Handicraft ID",
        type: "text",
        required: true,
        help: "References Handicraft.id.",
      },
      {
        key: "status",
        label: "Status",
        type: "text",
        required: true,
        defaultValue: "UNVERIFIED",
      },
      { key: "registration", label: "Registration", type: "text" },
      { key: "origin", label: "Origin", type: "text" },
      { key: "history", label: "History", type: "textarea" },
      { key: "sourceUrl", label: "Source URL", type: "text" },
    ],
  },
  {
    key: "Handicraft",
    label: "Handicraft",
    columns: ["slug", "name", "categoryId", "state"],
    fields: [
      { key: "slug", label: "Slug", type: "text", required: true },
      { key: "name", label: "Name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "state", label: "State", type: "text" },
      { key: "region", label: "Region", type: "text" },
      {
        key: "categoryId",
        label: "Category ID",
        type: "text",
        required: true,
        help: "References HandicraftCategory.id.",
      },
    ],
  },
  {
    key: "HandicraftCategory",
    label: "HandicraftCategory",
    columns: ["name"],
    fields: [{ key: "name", label: "Name", type: "text", required: true }],
  },
  {
    key: "ImageEmbedding",
    label: "ImageEmbedding",
    columns: ["referenceId", "modelName"],
    fields: [
      {
        key: "referenceId",
        label: "Reference image ID",
        type: "text",
        required: true,
        help: "References ReferenceImage.id.",
      },
      {
        key: "vector",
        label: "Vector (JSON array/object)",
        type: "json",
        required: true,
        defaultValue: "[]",
      },
      { key: "modelName", label: "Model name", type: "text", required: true },
    ],
    help: "Embeddings are stored as JSON. No model or similarity search is currently configured.",
  },
  {
    key: "ReferenceImage",
    label: "ReferenceImage",
    columns: ["handicraftId", "url", "verified", "createdAt"],
    fields: [
      {
        key: "handicraftId",
        label: "Handicraft ID",
        type: "text",
        required: true,
        help: "References Handicraft.id.",
      },
      { key: "url", label: "Image URL", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "sourceUrl", label: "Source URL", type: "text" },
      {
        key: "verified",
        label: "Verified reference",
        type: "boolean",
        defaultValue: false,
        help: "Only mark verified when reviewed against a trusted source.",
      },
    ],
  },
  {
    key: "Scan",
    label: "Scan",
    columns: ["userId", "status", "category", "createdAt"],
    fields: [
      {
        key: "userId",
        label: "User Clerk ID",
        type: "text",
        help: "Optional. References User.clerkId, not User.id.",
      },
      { key: "imageUrl", label: "Image URL", type: "text", required: true },
      {
        key: "status",
        label: "Status",
        type: "text",
        required: true,
        defaultValue: "ANALYZING",
      },
      { key: "category", label: "Category", type: "text" },
      { key: "score", label: "Score", type: "number" },
    ],
  },
  {
    key: "ScanFeedback",
    label: "ScanFeedback",
    columns: ["scanId", "rating", "comment"],
    fields: [
      {
        key: "scanId",
        label: "Scan ID",
        type: "text",
        required: true,
        help: "References Scan.id.",
      },
      {
        key: "rating",
        label: "Rating",
        type: "select",
        required: true,
        options: ["HELPFUL", "NOT_HELPFUL"],
      },
      { key: "comment", label: "Comment", type: "textarea" },
    ],
  },
  {
    key: "ScanResult",
    label: "ScanResult",
    columns: ["scanId", "result"],
    fields: [
      {
        key: "scanId",
        label: "Scan ID",
        type: "text",
        required: true,
        help: "References Scan.id.",
      },
      {
        key: "result",
        label: "Result (JSON)",
        type: "json",
        required: true,
        defaultValue: "{}",
      },
    ],
  },
  {
    key: "User",
    label: "User",
    columns: ["email", "role", "clerkId", "createdAt"],
    fields: [
      {
        key: "clerkId",
        label: "Clerk user ID",
        type: "text",
        required: true,
        help: "This row does not create, edit, or delete the user's Clerk identity.",
      },
      { key: "email", label: "Email", type: "text", required: true },
      {
        key: "role",
        label: "Role",
        type: "select",
        required: true,
        options: ["USER", "ADMIN"],
        defaultValue: "USER",
      },
    ],
    help: "Database changes do not change Clerk accounts. Deleted Clerk users may be re-created in this database on their next request.",
  },
  {
    key: "UserProfile",
    label: "UserProfile",
    columns: ["userId", "name", "avatar"],
    fields: [
      {
        key: "userId",
        label: "User ID",
        type: "text",
        required: true,
        help: "References User.id.",
      },
      { key: "name", label: "Name", type: "text" },
      { key: "avatar", label: "Avatar URL", type: "text" },
    ],
  },
];
