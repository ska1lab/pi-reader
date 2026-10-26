import { getPiSession } from "../utils/pi-session";
import type { ChatMessage } from "#shared/types/pi-session";

export default defineEventHandler(async () => {
  const session = await getPiSession();
  const entries = session.sessionManager.getBranch();

  const messages: ChatMessage[] = [];

  for (const entry of entries) {
    if (entry.type !== "message") {
      continue;
    }

    const message = entry.message;

    if (message.role !== "user" && message.role !== "assistant") {
      continue;
    }

    const content =
      typeof message.content === "string"
        ? message.content
        : message.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("");

    if (content.trim() === "") {
      continue;
    }

    messages.push({
      id: entry.id,
      role: message.role,
      content,
    });
  }
  return { messages };
});
