export type Message = {
  role: "user" | "bot";
  text: string;
};

export type Chat = {
  id: string;
  name: string;
  messages: Message[];
};
