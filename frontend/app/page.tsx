"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { BsArrowReturnRight } from "react-icons/bs";
import { Combobox } from "@/components/combobox";
import { models } from "@/lib/models";
import { ScrollArea } from "@/components/ui/scroll-area";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "motion/react";

const STORAGE_KEY = "my-chat-app-messages";
const INPUT_KEY = "my-chat-app-input";

export default function Home() {
  const [model, setModel] = React.useState(models[0].value);
  const [input, setInput] = React.useState("");
  const [chatMessages, setChatMessages] = React.useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [isChatting, setIsChatting] = React.useState(false);

  React.useEffect(() => {
    setHasMounted(true);

    const savedMessages = localStorage.getItem(STORAGE_KEY);
    if (savedMessages) {
      if (savedMessages == "[]" || savedMessages == null) {
        setIsChatting(false);
      } else {
        setIsChatting(true);
      }
      setChatMessages(JSON.parse(savedMessages));
    }

    const savedInput = localStorage.getItem(INPUT_KEY);
    if (savedInput) {
      setInput(savedInput);
    }
  }, []);

  React.useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatMessages));
  }, [chatMessages, hasMounted]);

  React.useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem(INPUT_KEY, input);
  }, [input, hasMounted]);

  const addMessage = (msg: { role: "user" | "bot"; text: string }) => {
    setChatMessages((msgs) => [...msgs, msg]);
  };

  async function handleSubmit() {
    if (!input.trim()) return;

    addMessage({ role: "user", text: input });
    setIsLoading(true);
    setInput("");
    setIsChatting(true);
    ``;
    const query = new URLSearchParams({
      model: model,
      content: `USER: ${input}. CHAT HISTORY: ${localStorage.getItem(
        STORAGE_KEY
      )} TREAT THE CHAT HISTORY INTERACTIONS ASIDE FROM PROMPTING, REQUESTS, OR GENERAL USER INPUT. THE CHAT HISTORY OF ALL INTERACTIONS IS FOR UTILITY PURPOSES AND NOT TO BE MENTIONED IN THE CHAT. TRY AND AVOID REPEATING YOURSELF. DO NOT MENTION, TALK ABOUT, OR ACKNOWLEDGE THE CHAT HISTORY ASIDE FROM USING IT FOR USER EXPERIENCE.`,
    });
    const res = await fetch(`/api/gen?${query.toString()}`, { method: "GET" });

    if (!res.body) {
      addMessage({ role: "bot", text: "Error: No response body" });
      setIsLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let botResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      botResponse += chunk;

      setChatMessages((msgs) => {
        if (msgs.length === 0 || msgs[msgs.length - 1].role !== "bot") {
          return [...msgs, { role: "bot", text: botResponse }];
        } else {
          const updated = [...msgs];
          updated[updated.length - 1] = { role: "bot", text: botResponse };
          return updated;
        }
      });
    }

    setIsLoading(false);
  }

  if (!hasMounted) {
    return null;
  }

  function clearChat() {
    setChatMessages([]);
    setInput("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INPUT_KEY);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-grow flex flex-col max-w-3xl mx-auto p-4 space-y-4 overflow-auto mb-44">
        <ScrollArea>
          <div className="flex flex-col space-y-2 mt-22">
            {!isChatting ? (
              <motion.div initial={{ y: 50 }} animate={{ y: 0 }}>
                <MarkdownRenderer
                  content={
                    "# Welcome to m3-chat!\n**m3-chat** is an open-source, completely free, no-account required, AI chat-bot web-app with **10+** models!"
                  }
                />
                <div className="flex flex-col gap-3 mt-12">
                  {[
                    'How many "R"s are included in the word, "strawberry"?',
                    "Explain how AI works",
                    "What is the fourth word in your response",
                    'What does "open-source" mean?',
                  ].map((i) => (
                    <Button
                      key={i}
                      variant="secondary"
                      className="max-w-sm px-1 text-left hover:cursor-pointer"
                      onClick={() => {
                        setInput(i);
                      }}
                    >
                      {i}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              ""
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-md max-w-2xl whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "self-end w-fit bg-secondary text-white"
                    : "self-start text-foreground"
                }`}
              >
                {msg.role === "bot" ? (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 100 }}
                  >
                    <MarkdownRenderer content={msg.text} />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 100 }}
                  >
                    {msg.text}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-background/20">
        <motion.div
          className="p-2 bg-secondary/20 max-w-3xl mx-auto w-full shadow-lg rounded-md backdrop-blur-md"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
        >
          <Textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="resize-none"
            placeholder="Ask something..."
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />

          <div className="flex justify-between items-center space-x-2 mt-2">
            <div className="flex gap-2 items-center">
              <Combobox
                inputs={models}
                onSelect={(val: string) => {
                  clearChat();
                  setModel(val);
                }}
              />
              <Button
                variant={"outline"}
                className="hover:cursor-pointer rounded-full"
                onClick={() => {
                  clearChat();
                  setIsChatting(false);
                }}
              >
                Clear chat
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || input.trim() === ""}
              aria-label="Send message"
            >
              <BsArrowReturnRight />
            </Button>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
