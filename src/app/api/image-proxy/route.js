import { NextRequest, NextResponse } from "next/server";

export async function GET(request) {
  const imageUrl = request.nextUrl.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Image URL required" }, { status: 400 });
  }

  const res = await fetch(imageUrl);
  const contentType = res.headers.get("content-type");
  const response = new NextResponse(res.body, {
    headers: {
      "Content-Type": contentType || "image/jpeg",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=60",
    },
  });

  return response;
}
