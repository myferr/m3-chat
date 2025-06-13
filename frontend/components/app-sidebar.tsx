"use client";

import * as React from "react";
import { BsPlus, BsTrash } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chat, Message } from "@/types/chat";

type AppSidebarProps = {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onCreateChat: (newChat: Chat) => void;
  onDeleteChat: (id: string) => void;
};

export default function AppSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
}: AppSidebarProps) {
  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      name: "New Chat",
      messages: [],
    };
    onCreateChat(newChat);
    onSelectChat(newChat.id);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Chats</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={createNewChat}
          aria-label="Create new chat"
          className="p-1 rounded-md"
        >
          <BsPlus size={18} />
        </Button>
      </div>

      <ScrollArea className="flex-grow p-2">
        {chats.length === 0 && (
          <p className="text-center text-muted-foreground mt-4">
            No chats yet. Click + to start a new chat.
          </p>
        )}
        <ul className="flex flex-col space-y-1">
          {chats.map((chat) => {
            const isActive = chat.id === activeChatId;
            return (
              <li
                key={chat.id}
                className={`flex items-center justify-between cursor-pointer rounded-md p-2 select-none transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <span className="truncate max-w-[180px]">
                  {chat.name || "Untitled Chat"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="p-1 hover:text-destructive"
                  aria-label="Delete chat"
                  title="Delete chat"
                >
                  <BsTrash size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </aside>
  );
}
