import { NextRequest } from "next/server";

export const runtime = "edge"; // im gonna try the edge runtime one more time, it should stream

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const model = url.searchParams.get("model");
  const content = url.searchParams.get("content");

  if (!model || !content) {
    return new Response("Missing params", { status: 400 });
  }

  const backendUrl = `${process.env.TUNNEL}/api/gen?model=${encodeURIComponent(model)}&content=${encodeURIComponent(content)}`;

  try {
    const backendResponse = await fetch(backendUrl);

    if (!backendResponse.body) {
      return new Response("No response body from backend", { status: 502 });
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("Content-Type") || "text/plain",
        // im not gonna set 'Transfer-Encoding', i'll let the backend handle it
      },
    });
  } catch (err) {
    return new Response(`Error: ${(err as Error).message}`, { status: 500 });
  }
}
