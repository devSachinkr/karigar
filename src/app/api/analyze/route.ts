import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ensureDatabaseUser } from "@/lib/database-user";
import {
  getCloudinary,
  isCloudinaryConfigured,
  uploadScanImage,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";

type GeminiAnalysis = {
  status: "Category identified" | "Unable to Identify";
  category: string;
  classificationConfidence: number | null;
  visualSimilarity: number | null;
  matchingIndicators: string[];
  uncertainIndicators: string[];
  explanation: string;
};

class GeminiProviderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function normalizeScore(value: number | null): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const percentage = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(percentage)));
}

async function analyzeWithGemini(file: File): Promise<GeminiAnalysis> {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) throw new Error("Gemini API key is not configured.");

  const primaryModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.8-flash";
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const prompt = `You are a cautious visual handicraft assistant.
Analyze only visible characteristics in this image.
Do not claim authenticity, origin, manufacturing process, material, or provenance.
Choose one category: Jewelry, Pashmina, Banarasi, Pottery, Phulkari, Blue Pottery, Other handicraft, Unknown / Not a handicraft.
Return only valid JSON in this exact shape:
{"status":"Category identified|Unable to Identify","category":"...","classificationConfidence":number or null,"visualSimilarity":null,"matchingIndicators":["..."],"uncertainIndicators":["..."],"explanation":"..."}
classificationConfidence must be a percentage integer from 0 to 100. Set status to Category identified when a recognizable object/craft category is visible, including Jewelry. Use Unable to Identify only when no category can reasonably be identified. Set visualSimilarity to null because this service has no verified reference-image comparison database. Do not treat category identification as authenticity verification.`;

  const body = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: file.type, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 700,
      responseMimeType: "application/json",
    },
  });
  let response: Response | undefined;
  for (const model of [...new Set([primaryModel, fallbackModel])]) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(20_000),
        });
      } catch (error) {
        if (attempt === 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }

      if (
        response.ok ||
        ![404, 429, 500, 502, 503, 504].includes(response.status)
      )
        break;
      await response.body?.cancel();
      if (attempt === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (
      response?.ok ||
      (response && ![404, 429, 500, 502, 503, 504].includes(response.status))
    )
      break;
  }

  if (!response?.ok) {
    if (!response) throw new Error("Gemini did not return a response.");
    const providerError = await response.text();
    console.error(
      "Gemini analysis failed",
      response.status,
      providerError.slice(0, 500),
    );
    if (response.status === 429 || response.status === 503) {
      throw new GeminiProviderError(
        "Gemini is temporarily busy. Please wait a moment and try again.",
        503,
      );
    }
    if (response.status === 401 || response.status === 403) {
      throw new GeminiProviderError(
        "Gemini rejected the API key. Check the server-side API key configuration.",
        502,
      );
    }
    if (response.status === 404) {
      throw new GeminiProviderError(
        "The configured Gemini model is unavailable. Check GEMINI_MODEL.",
        502,
      );
    }
    throw new GeminiProviderError(
      "Gemini could not process this image. Please try again later.",
      502,
    );
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned no analysis.");

  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const jsonText = cleaned.match(/\{[\s\S]*\}/)?.[0];
  let analysis: GeminiAnalysis;
  try {
    if (!jsonText) throw new Error("No JSON object in response.");
    analysis = JSON.parse(jsonText) as GeminiAnalysis;
  } catch {
    console.error("Gemini returned an unreadable analysis", text.slice(0, 500));
    throw new GeminiProviderError(
      "Gemini returned an unreadable response. Please retry the image analysis.",
      502,
    );
  }

  if (
    !analysis.category ||
    !Array.isArray(analysis.matchingIndicators) ||
    !Array.isArray(analysis.uncertainIndicators)
  ) {
    throw new GeminiProviderError(
      "Gemini returned incomplete analysis. Please retry the image analysis.",
      502,
    );
  }

  const identifiable = !/^(unknown|unable|not a handicraft)/i.test(
    analysis.category.trim(),
  );
  return {
    ...analysis,
    status: identifiable ? "Category identified" : "Unable to Identify",
    classificationConfidence: normalizeScore(analysis.classificationConfidence),
    visualSimilarity: null,
  };
}

export async function POST(request: Request) {
  let scanId: string | undefined;
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "An image file is required." },
        { status: 400 },
      );
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json(
        { error: "Image must be smaller than 10 MB." },
        { status: 400 },
      );
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return NextResponse.json(
        { error: "Unsupported image type." },
        { status: 415 },
      );
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const validSignature =
      (file.type === "image/jpeg" &&
        signature[0] === 0xff &&
        signature[1] === 0xd8 &&
        signature[2] === 0xff) ||
      (file.type === "image/png" &&
        signature.slice(0, 8).join(",") === "137,80,78,71,13,10,26,10") ||
      (file.type === "image/webp" &&
        String.fromCharCode(...signature.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...signature.slice(8, 12)) === "WEBP");
    if (!validSignature)
      return NextResponse.json(
        { error: "The uploaded file content does not match its image type." },
        { status: 415 },
      );

    const user = await ensureDatabaseUser();
    if (!user)
      return NextResponse.json(
        { error: "Sign in before saving a scan." },
        { status: 401 },
      );
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Add the Cloudinary environment variables before scanning.",
        },
        { status: 503 },
      );
    }

    const imageAsset = await uploadScanImage(file);
    let scan;
    try {
      scan = await prisma.scan.create({
        data: {
          userId: user.clerkId,
          imageUrl: imageAsset.secure_url,
          status: "ANALYZING",
        },
      });
    } catch (error) {
      await getCloudinary()
        .uploader.destroy(imageAsset.public_id)
        .catch((cleanupError) => {
          console.error(
            "Could not clean up an untracked Cloudinary image",
            cleanupError,
          );
        });
      throw error;
    }
    scanId = scan.id;

    let analysis: GeminiAnalysis;
    try {
      if (
        process.env.AI_PROVIDER === "gemini" ||
        process.env.AI_PROVIDER_API_KEY
      ) {
        analysis = await analyzeWithGemini(file);
      } else {
        throw new GeminiProviderError("AI analysis is not configured.", 503);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed.";
      await prisma.$transaction([
        prisma.scan.update({
          where: { id: scan.id },
          data: { status: "FAILED" },
        }),
        prisma.scanResult.create({
          data: {
            scanId: scan.id,
            result: { error: errorMessage } as Prisma.InputJsonValue,
          },
        }),
      ]);
      throw error;
    }

    const responseData = {
      ...analysis,
      notice: "AI-assisted visual assessment",
      verificationStatus:
        "Not verified — no verified reference-image comparison is configured.",
      limitations: [
        "Category identification is not proof of authenticity.",
        "Material, manufacturing process and provenance cannot be verified from this image.",
        "Visual similarity is unavailable because no verified reference-image database is configured.",
      ],
    };

    await prisma.$transaction([
      prisma.scan.update({
        where: { id: scan.id },
        data: {
          status: analysis.status,
          category: analysis.category,
          score: null,
        },
      }),
      prisma.scanResult.create({
        data: {
          scanId: scan.id,
          result: responseData as Prisma.InputJsonValue,
        },
      }),
    ]);

    return NextResponse.json({
      ...responseData,
      scanId: scan.id,
      imageUrl: imageAsset.secure_url,
    });
  } catch (error) {
    console.error("Image analysis request failed", error);
    if (scanId && !(error instanceof GeminiProviderError)) {
      await prisma.scan
        .updateMany({
          where: { id: scanId, status: "ANALYZING" },
          data: { status: "FAILED" },
        })
        .catch((updateError) =>
          console.error("Could not mark scan as failed", updateError),
        );
    }
    if (error instanceof GeminiProviderError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Analysis service is unavailable. Please try again later." },
      { status: 503 },
    );
  }
}
