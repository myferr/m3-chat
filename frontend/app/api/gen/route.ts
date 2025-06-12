import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const model = url.searchParams.get("model");
    const content = url.searchParams.get("content");

    if (!model || !content) {
      return NextResponse.json(
        { error: "Missing model or content" },
        { status: 400 }
      );
    }

    const { spawn } = await import("child_process");

    const cmd = "ollama";
    const args = ["run", model];
    const proc = spawn(cmd, args, { stdio: ["pipe", "pipe", "inherit"] });

    // Write the content to the process stdin
    proc.stdin.write(content + "\n");
    proc.stdin.end();

    // Stream the stdout from the process back to client
    const stream = new ReadableStream({
      start(controller) {
        proc.stdout.on("data", (chunk) => {
          controller.enqueue(new TextEncoder().encode(chunk));
        });
        proc.stdout.on("end", () => {
          controller.close();
        });
        proc.stdout.on("error", (err) => {
          controller.error(err);
        });
      },
      cancel() {
        proc.kill();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
