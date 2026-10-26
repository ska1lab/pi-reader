import { createAgentSession } from "@earendil-works/pi-coding-agent";

// 第一调用创建会话 之后调用复用已有的创建结果
let sessionPromise: ReturnType<typeof createAgentSession> | undefined;

export async function getPiSession() {
  // 是否存在会话 不存在的话创建一个
  if (!sessionPromise) {
    // 创建 pi session 工作目录 cwd
    sessionPromise = createAgentSession({
      cwd: "E:/nuxt/pi-reader",
    });
  }

  try {
    const { session } = await sessionPromise;
    return session;
  } catch (error) {
    // 创建失败时清空缓存 将错误抛出去
    sessionPromise = undefined;
    throw error;
  }
}

export async function disposePiSession() {
  if (!sessionPromise) {
    return;
  }

  try {
    // 如果已有会话创建任务等待完成
    const { session } = await sessionPromise;
    // 释放会话
    session.dispose();
  } finally {
    // 清空保存的引用
    sessionPromise = undefined;
  }
}

export const piSessionState: {
  busy: boolean;
  requestId: string | null;
} = {
  busy: false,
  requestId: null,
};
