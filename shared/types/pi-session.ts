export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ModelOption = {
  provider: string;
  id: string;
  name: string;
};
