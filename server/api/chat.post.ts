import { getPiSession, piSessionState } from "../utils/pi-session";

export default defineEventHandler(async (event) => {
  // 获取请求体
  const body = await readBody(event);

  // 判断请求体中携带的 message 是否是 string 类型
  if (typeof body?.message !== "string") {
    // 抛出 error
    throw createError({
      statusCode: 400,
      statusMessage: "messsage must be a string",
    });
  }
  if (typeof body?.requestId !== "string" || body.requestId.trim() === "") {
    throw createError({
      statusCode: 400,
      statusMessage: "requestId must be a non-empty string",
    });
  }

  const requestId = body.requestId.trim();

  // 去除 message 中空格
  const message = body.message.trim();

  // 判断 message 是否为空字符串
  if (message === "") {
    // 抛出 error
    throw createError({
      statusCode: 400,
      statusMessage: "messsage must no be empty",
    });
  }

  // 如果 正在执行任务 则是 busy 状态
  if (piSessionState.busy) {
    throw createError({
      statusCode: 409,
      statusMessage: "Pi session is busy",
    });
  }

  // 请求开始时标记忙碌
  piSessionState.busy = true;
  piSessionState.requestId = requestId;
  try {
    // 获取共享会话
    const session = await getPiSession();

    // 把 message 交给 共享会话 执行，等待执行结束
    const unsubscribe = session.subscribe((event) => {
      if (
        event.type === "message_update" &&
        event.assistantMessageEvent.type === "text_delta"
      ) {
        process.stdout.write(event.assistantMessageEvent.delta);
      }
    });

    try {
      await session.prompt(message);
    } finally {
      unsubscribe();
      process.stdout.write("\n");
    }

    // 判断是否报错
    if (session.state.errorMessage) {
      console.error("Pi 调用失败：", session.state.errorMessage);

      throw createError({
        statusCode: 500,
        statusMessage: "Pi request failed",
      });
    }

    // 获取 执行结束后得到的回答
    const text = session.getLastAssistantText();

    // 判断回复内容是否非字符串与为空
    if (typeof text != "string" || text.trim() === "") {
      throw createError({
        status: 500,
        statusMessage: "Pi returned no text",
      });
    }

    // 返回模型输出的内容
    return { text };
  } finally {
    // 请求结束后解除忙碌
    piSessionState.requestId = null;
    piSessionState.busy = false;
  }
});
