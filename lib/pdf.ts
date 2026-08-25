"use client";

// Best-effort client-side PDF text extraction using pdfjs-dist.
// If extraction fails (scanned/image-only PDF, worker load issue, etc.) we
// fail soft: the file is still stored, just without extracted text, and the
// AI tutor is told plainly that it couldn't read that particular file.

export async function extractPdfText(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");
    // Load the matching worker from a CDN so we don't have to wire up
    // Next.js asset copying for the worker file.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

    let text = "";
    const maxPages = Math.min(pdf.numPages, 40); // guardrail for huge PDFs
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      text += `\n\n--- Page ${i} ---\n${pageText}`;
    }
    return text.trim();
  } catch (err) {
    console.error("PDF extraction failed", err);
    return "";
  }
}
