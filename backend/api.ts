import express from "express";
import { spawn } from "child_process";
import cors from "cors";

const app = express();
const PORT = 2000;

app.use(cors());

app.get("/api/gen", (req, res) => {
  const model = req.query.model as string;
  const content = req.query.content as string;

  if (!model || !content) {
    res.status(400).send("Missing model or content");
    return;
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const ollama = spawn("ollama", ["run", model], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  ollama.stdout.on("data", (chunk) => {
    res.write(chunk);
  });

  ollama.stderr.on("data", (chunk) => {
    console.error(chunk.toString());
  });

  ollama.on("close", () => {
    res.end();
  });

  ollama.stdin.write(content);
  ollama.stdin.end();
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
