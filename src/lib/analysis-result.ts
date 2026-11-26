import { z } from "zod";

export const geminiAnalysisSchema = z
  .object({
    status: z.enum(["Category identified", "Unable to Identify"]),
    category: z.string().trim().min(1),
    craftMatch: z.string().trim().min(1).max(100).nullable(),
    craftMatchType: z.enum([
      "likely_visual_match",
      "similar_visual_style",
      "none",
    ]),
    classificationConfidence: z.number().nullable(),
    visualSimilarity: z.null(),
    matchingIndicators: z.array(z.string()),
    uncertainIndicators: z.array(z.string()),
    explanation: z.string().trim().min(1),
  })
  .refine(
    result =>
      (result.craftMatchType === "none") === (result.craftMatch === null),
    {
      path: ["craftMatch"],
      message: "A named craft match must include a match type.",
    },
  );

export type GeminiAnalysis = z.infer<typeof geminiAnalysisSchema>;

export type AnalysisResult = GeminiAnalysis & {
  notice: string;
  verificationStatus: string;
  limitations: string[];
  scanId: string;
  imageUrl: string;
};
