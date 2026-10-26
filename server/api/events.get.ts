import { getPiSession, piSessionState } from "../utils/pi-session";

export default defineEventHandler(async (event) => {
  const session = await getPiSession();
  const stream = createEventStream(event);

  const unsubscribe = session.subscribe((piEvent) => {
    if (
      piEvent.type === "message_update" &&
      piEvent.assistantMessageEvent.type === "text_delta"
    ) {
      const requestId = piSessionState.requestId;

      if (!requestId) {
        return;
      }
      void stream
        .push({
          event: "text_delta",
          data: JSON.stringify({
            requestId,
            delta: piEvent.assistantMessageEvent.delta,
          }),
        })
        .catch((error) => {
          console.error("SSE 文本发送失败：", error);
        });
    }
  });

  stream.onClosed(unsubscribe);

  void stream
    .push({
      event: "ready",
      data: "{}",
    })
    .catch((error) => {
      console.error("SSE 就绪事件发送失败：", error);
    });

  return stream.send();
});
