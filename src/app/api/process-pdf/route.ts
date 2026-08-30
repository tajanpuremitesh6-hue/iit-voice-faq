import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      "documents",
      "iit-delhi.pdf"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        {
          success: false,
          error: `PDF not found: ${filePath}`,
        },
        { status: 404 }
      );
    }

    const pdfBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(pdfBuffer);

    return NextResponse.json({
      success: true,
      pages: data.numpages,
      text: data.text,
    });
  } catch (error) {
    console.error("PDF ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}