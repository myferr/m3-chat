import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const model = url.searchParams.get("model");
  const content = url.searchParams.get("content");

  if (!model || !content) {
    return new Response("Missing params", { status: 400 });
  }

  const backendUrl = new URL(`${process.env.TUNNEL}/api/gen`);
  backendUrl.searchParams.set("model", model);
  backendUrl.searchParams.set("content", content);

  try {
    const backendResponse = await fetch(backendUrl.toString());

    if (!backendResponse.body) {
      return new Response("No response body from backend", { status: 502 });
    }

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("Content-Type") ?? "text/plain",
      },
    });
  } catch (err) {
    return new Response(`Error: ${(err as Error).message}`, { status: 500 });
  }
}
