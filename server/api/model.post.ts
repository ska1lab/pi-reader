import { getPiSession, piSessionState } from "../utils/pi-session";

export default defineEventHandler(async (event) => {
  // 读取检查体
  const body = await readBody(event);

  // 检查 传参中的 provider 和 id 是否都为 string 类型
  if (typeof body?.provider !== "string" || typeof body?.id !== "string") {
    throw createError({
      statusCode: 400,
      statusMessage: "provider and id must be strings",
    });
  }

  // 去除 首尾空格
  const provider = body?.provider.trim();
  const id = body?.id.trim();

  // 校验 是否为空
  if (provider === "" || id === "") {
    throw createError({
      statusCode: 400,
      statusMessage: "provider and id must not be empty",
    });
  }

  // 检查 session state 忙碌跑出 409
  if (piSessionState.busy) {
    throw createError({
      statusCode: 409,
      statusMessage: "Pi session is busy ",
    });
  }

  // 设置 忙碌状态
  piSessionState.busy = true;
  try {
    // 获取会话
    const session = await getPiSession();

    // 获取可用模型
    const availableModels = await session.modelRuntime.getAvailable();

    // 检查拟切换模型是否存在
    const model = availableModels.find(
      (item) => item.provider === provider && item.id === id,
    );

    // 不存在 抛出异常
    if (!model) {
      throw createError({
        statusCode: 400,
        statusMessage: "Model is unavailable",
      });
    }

    // 存在则切换模型
    await session.setModel(model);

    // 返回切换后的当前模型信息
    const currentModel = session.model
      ? {
          provider: session.model.provider,
          id: session.model.id,
          name: session.model.name,
        }
      : null;

    return { currentModel };
  } finally {
    // 解除忙碌状态
    piSessionState.busy = false;
  }
});
