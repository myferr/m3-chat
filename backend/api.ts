import express from "express";
import { spawn } from "child_process";
import cors from "cors";

const app = express();
const PORT = 2000;

app.use(cors());

app.get("/api/gen", async (req, res) => {
  const model = req.query.model as string;
  const content = req.query.content as string;

  if (!model || !content) {
    return res.status(400).send("Missing model or content");
  }

  try {
    const ollama = spawn("ollama", ["run", model, content]);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    ollama.stdout.on("data", (data: Buffer) => {
      res.write(data.toString());
    });

    ollama.stderr.on("data", (data: Buffer) => {
      console.error(`[stderr]: ${data}`);
    });

    ollama.on("close", () => {
      res.end();
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🦙 Ollama tunnel running at http://localhost:${PORT}`);
});
