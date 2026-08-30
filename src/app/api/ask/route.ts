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

    // 1. Create embedding for the question
    const embeddingResult = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: question,
      config: {
        outputDimensionality: 768,
      },
    });

    const queryEmbedding =
      embeddingResult.embeddings?.[0]?.values;

    if (!queryEmbedding) {
      throw new Error("Failed to create question embedding");
    }

    // 2. Detect which IIT the user is asking about
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

    // 3. Search for relevant chunks
    const { data: searchResults, error: searchError } =
      await supabase.rpc("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_count: 50,
      });

    if (searchError) {
      throw new Error(
        `Vector search failed: ${searchError.message}`
      );
    }

    let chunks = searchResults || [];

    // 4. If a specific IIT was mentioned,
    // prioritize chunks from that IIT
    if (targetDocument) {
      const filteredChunks = chunks.filter(
        (chunk: { document_name: string }) =>
          chunk.document_name?.toLowerCase() ===
          targetDocument
      );

      if (filteredChunks.length > 0) {
        chunks = filteredChunks;
      }
    }

    // Keep only the 5 most relevant chunks
    chunks = chunks.slice(0, 5);

    // 5. If no relevant chunks were found
    if (chunks.length === 0) {
      return NextResponse.json({
        success: true,
        answer:
          "I couldn't find relevant information in the available IIT documents.",
        sources: [],
      });
    }

    // 6. Build context from retrieved chunks
    const context = chunks
      .map(
        (chunk: {
          document_name: string;
          chunk_text: string;
        }) =>
          `Source: ${chunk.document_name}\n${chunk.chunk_text}`
      )
      .join("\n\n---\n\n");

    // 7. Ask Gemini to answer using ONLY the retrieved context
    const prompt = `
You are an IIT information assistant.

Answer the user's question using ONLY the information
provided in the context below.

If the answer is not present in the context, say:
"I couldn't find that information in the available IIT documents."

Do not invent facts.

Keep the answer clear, concise, and useful.

User question:
${question}

Context:
${context}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const answer = response.text;

    // 8. Return answer and sources
    return NextResponse.json({
      success: true,
      answer,
      detected_document: targetDocument,
      sources: chunks.map(
        (chunk: {
          document_name: string;
          chunk_index: number;
          similarity: number;
        }) => ({
          document_name: chunk.document_name,
          chunk_index: chunk.chunk_index,
          similarity: chunk.similarity,
        })
      ),
    });
  } catch (error) {
    console.error("ASK ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}