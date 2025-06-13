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
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import type { Chat, Message } from "@/types/chat";

const STORAGE_KEY = "savedchats";
const ACTIVE_CHAT_KEY = "activeChatId";

export default function Home() {
  const [model, setModel] = React.useState(models[0].value);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);

  const onSelectChat = (id: string) => setActiveChatId(id);
  const onCreateChat = (newChat: Chat) => {
    setChats((prev) => [...prev, newChat]);
    setActiveChatId(newChat.id);
  };
  const onDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  };

  React.useEffect(() => {
    setHasMounted(true);
    // Load chats from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const savedChats: Chat[] = JSON.parse(raw);
        setChats(savedChats);

        // Load active chat ID or fallback to first chat's id
        const savedActiveId = localStorage.getItem(ACTIVE_CHAT_KEY);
        if (savedActiveId && savedChats.find((c) => c.id === savedActiveId)) {
          setActiveChatId(savedActiveId);
        } else if (savedChats.length > 0) {
          setActiveChatId(savedChats[0].id);
        }
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  React.useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats, hasMounted]);

  React.useEffect(() => {
    if (!hasMounted) return;
    if (activeChatId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, activeChatId);
    }
  }, [activeChatId, hasMounted]);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // Add a message to the active chat
  const addMessage = React.useCallback(
    (msg: Message) => {
      if (!activeChatId) return;
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, msg] }
            : chat
        )
      );
    },
    [activeChatId]
  );

  // This useEffect handles AI response streaming for the last user message, including when a new chat is created
  React.useEffect(() => {
    if (!activeChatId || !hasMounted) return;
    const chat = chats.find((c) => c.id === activeChatId);
    if (!chat) return;

    // Find last user message without bot reply
    const messages = chat.messages;
    if (messages.length === 0 || messages[messages.length - 1].role !== "user")
      return;
    if (messages.length >= 2 && messages[messages.length - 2].role === "bot")
      return; // Already replied

    // Async function to fetch AI response
    async function fetchAI() {
      setIsLoading(true);

      const userMessage = messages[messages.length - 1].text;

      const query = new URLSearchParams({
        model,
        content: `USER: ${userMessage}. CHAT HISTORY: ${JSON.stringify(
          messages.slice(0, -1)
        )} TREAT THE CHAT HISTORY INTERACTIONS ASIDE FROM PROMPTING, REQUESTS, OR GENERAL USER INPUT. THE CHAT HISTORY OF ALL INTERACTIONS IS FOR UTILITY PURPOSES AND NOT TO BE MENTIONED IN THE CHAT. TRY AND AVOID REPEATING YOURSELF. DO NOT MENTION, TALK ABOUT, OR ACKNOWLEDGE THE CHAT HISTORY ASIDE FROM USING IT FOR USER EXPERIENCE.`,
      });

      try {
        const res = await fetch(`/api/gen?${query.toString()}`);

        if (!res.body) {
          addMessage({ role: "bot", text: "Error: No response body" });
          setIsLoading(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        // Add placeholder bot message
        addMessage({ role: "bot", text: "" });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          setChats((prev) => {
            const updated = [...prev];
            const chatIndex = updated.findIndex((c) => c.id === activeChatId);
            if (chatIndex === -1) return prev;

            const lastMessages = updated[chatIndex].messages;
            if (lastMessages[lastMessages.length - 1]?.role === "bot") {
              lastMessages[lastMessages.length - 1] = {
                role: "bot",
                text: accumulated,
              };
            }
            updated[chatIndex] = {
              ...updated[chatIndex],
              messages: lastMessages,
            };
            return updated;
          });
        }
      } catch (error) {
        addMessage({ role: "bot", text: `Error: ${(error as Error).message}` });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, chats, model, hasMounted]);

  // Submit handler for input
  async function handleSubmit() {
    if (!input.trim()) return;

    if (!activeChatId) {
      // No active chat, create new chat with first user message
      const newId = crypto.randomUUID();
      const newChat: Chat = {
        id: newId,
        name: "New Chat",
        messages: [{ role: "user", text: input }],
      };
      setChats((prev) => [...prev, newChat]);
      setActiveChatId(newId);
      setInput("");
      // AI response will be handled in the useEffect watching chats + activeChatId
      return;
    }

    // Normal case: add user message to existing active chat
    addMessage({ role: "user", text: input });
    setInput("");
  }

  function clearChat() {
    if (!activeChatId) return;
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId ? { ...chat, messages: [] } : chat
      )
    );
  }

  if (!hasMounted) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={onSelectChat}
        onCreateChat={onCreateChat}
        onDeleteChat={onDeleteChat}
      />
      <div className="ml-64 flex-grow flex flex-col items-center p-4 space-y-4 overflow-auto mb-44">
        <main className="w-full max-w-3xl">
          <ScrollArea>
            <div className="flex flex-col space-y-2 mt-22">
              {!activeChat || activeChat.messages.length === 0 ? (
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
              ) : null}
              {activeChat?.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`w-full flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn(
                      "p-3 rounded-md whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-secondary text-white text-right max-w-sm"
                        : "text-foreground text-left w-full max-w-3xl"
                    )}
                  >
                    {msg.role === "bot" ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      msg.text
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 ml-64 flex justify-center">
          <motion.div
            className="p-2 w-full max-w-3xl shadow-lg rounded-md backdrop-blur-md"
            initial={{ y: 50 }}
            animate={{ y: 0 }}
          >
            <Textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="resize-none"
              placeholder={
                activeChat
                  ? "Ask something..."
                  : "Create a new chat from the sidebar first or type to start"
              }
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
                  onClick={clearChat}
                  disabled={!activeChat}
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
    </SidebarProvider>
  );
}
