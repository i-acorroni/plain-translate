import { NextResponse } from "next/server";
import { generateMockRewrite } from "@/lib/mock-rewrite";
import { generateOpenRouterRewrite, hasOpenRouterConfig } from "@/lib/openrouter";
import { parseRewriteRequest } from "@/lib/rewrite-schema";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = parseRewriteRequest(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rewriteRequest = parsed.value;

  if (!hasOpenRouterConfig()) {
    return NextResponse.json(generateMockRewrite(rewriteRequest));
  }

  try {
    const response = await generateOpenRouterRewrite(rewriteRequest);
    return NextResponse.json(response);
  } catch (error) {
    console.error("OpenRouter rewrite failed, returning mock output instead.", error);
    return NextResponse.json(generateMockRewrite(rewriteRequest));
  }
}
