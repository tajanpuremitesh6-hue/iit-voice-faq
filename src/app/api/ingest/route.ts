import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const documents = [
  "iit-madras.pdf",
  "iit-roorkee.pdf",
];

function createChunks(text: string, chunkSize = 1000, overlap = 200) {
  const chunks: string[] = [];

  for (let start = 0; start < text.length; start += chunkSize - overlap) {
    const chunk = text.slice(start, start + chunkSize).trim();

    if (chunk.length > 50) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

export async function GET() {
  try {
   const embeddingModel = "gemini-embedding-001";

    let totalChunks = 0;

    for (const fileName of documents) {
      const filePath = path.join(
        process.cwd(),
        "public",
        "documents",
        fileName
      );

      if (!fs.existsSync(filePath)) {
        console.log(`Skipping missing file: ${fileName}`);
        continue;
      }

      const pdfBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(pdfBuffer);

      const chunks = createChunks(data.text);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

       const embeddingResult = await ai.models.embedContent({
  model: embeddingModel,
  contents: chunk,
  config: {
    outputDimensionality: 768,
  },
});

const embedding = embeddingResult.embeddings?.[0]?.values;

if (!embedding) {
  throw new Error(`Failed to generate embedding for ${fileName}`);
}

        const { error } = await supabase
          .from("document_chunks")
          .insert({
            document_name: fileName,
            chunk_text: chunk,
            chunk_index: i,
            embedding: embedding,
          });

        if (error) {
          throw new Error(
            `Supabase error for ${fileName}: ${error.message}`
          );
        }

        totalChunks++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "All documents processed successfully",
      totalChunks,
    });
  } catch (error) {
    console.error("INGEST ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}