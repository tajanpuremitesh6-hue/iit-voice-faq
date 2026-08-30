import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Detect which IIT the user is asking about
    const lowerQuestion = question.toLowerCase();

    let targetDocument: string | null = null;

    if (
      lowerQuestion.includes("iit roorkee") ||
      lowerQuestion.includes("roorkee")
    ) {
      targetDocument = "iit-roorkee.pdf";
    } else if (
      lowerQuestion.includes("iit madras") ||
      lowerQuestion.includes("madras")
    ) {
      targetDocument = "iit-madras.pdf";
    }

    // Create question embedding
    const result = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: question,
      config: {
        outputDimensionality: 768,
      },
    });

    const queryEmbedding = result.embeddings?.[0]?.values;

    if (!queryEmbedding) {
      throw new Error("Failed to create question embedding");
    }

    // Get a larger pool so smaller documents like Roorkee
    // have a better chance of appearing in the results.
    const { data, error } = await supabase.rpc(
      "match_document_chunks",
      {
        query_embedding: queryEmbedding,
        match_count: 50,
      }
    );

    if (error) {
      throw new Error(`Vector search failed: ${error.message}`);
    }

    let results = data || [];

    // If the user specifically mentioned an IIT,
    // prioritize only that IIT's chunks.
    if (targetDocument) {
      const filteredResults = results.filter(
        (item: any) =>
          item.document_name?.toLowerCase() === targetDocument
      );

      if (filteredResults.length > 0) {
        results = filteredResults;
      }
    }

    // Keep only the best 5 results for the frontend
    results = results.slice(0, 5);

    return NextResponse.json({
      success: true,
      question,
      detected_document: targetDocument,
      results,
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}