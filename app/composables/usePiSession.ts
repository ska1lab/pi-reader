import type { ChatMessage } from "#shared/types/pi-session";
export function usePiSession() {
  const message = ref("");
  const messages = reactive<ChatMessage[]>([]);

  const chatError = ref("");
  const streamNotice = ref("");
  const sending = ref(false);

  let activeSource: EventSource | null = null;

  onScopeDispose(() => {
    activeSource?.close();
  });

  // 发送 function
  const send = async () => {
    if (!canSend.value) {
      return;
    }

    chatError.value = "";
    streamNotice.value = "";
    sending.value = true;

    const content = message.value.trim();

    let source: EventSource | null = null;
    let readyTimer: ReturnType<typeof setTimeout> | undefined;
    let replyId: string | undefined;
    let acceptingDeltas = false;

    try {
      if (content === "") {
        throw new Error("消息不能为空");
      }

      const requestId = crypto.randomUUID();
      replyId = requestId;

      const reply = reactive<ChatMessage>({
        id: requestId,
        role: "assistant",
        content: "",
      });

      messages.push({
        id: crypto.randomUUID(),
        role: "user",
        content,
      });
      message.value = "";

      const connection = new EventSource("/api/events");
      source = connection;
      activeSource = connection;

      connection.addEventListener("text_delta", (event) => {
        if (!acceptingDeltas) {
          return;
        }

        try {
          const data = JSON.parse(event.data);

          if (
            !data ||
            data.requestId !== requestId ||
            typeof data.delta !== "string"
          ) {
            return;
          }

          reply.content += data.delta;
        } catch (error) {
          console.error("解析实时消息失败：", error);
        }
      });

      await new Promise<void>((resolve, reject) => {
        let ready = false;

        readyTimer = setTimeout(() => {
          reject(new Error("实时连接超时，请重试"));
        }, 10000);

        connection.addEventListener(
          "ready",
          () => {
            ready = true;
            clearTimeout(readyTimer);
            resolve();
          },
          { once: true },
        );

        connection.onerror = () => {
          clearTimeout(readyTimer);
          connection.close();

          if (!ready) {
            reject(new Error("实时连接失败，请重试"));
          } else {
            acceptingDeltas = false;
            streamNotice.value =
              "实时连接已中断，任务仍在执行，正在等待最终结果。";
          }
        };
      });

      messages.push(reply);
      acceptingDeltas = true;

      const { text } = await $fetch<{ text: string }>("/api/chat", {
        method: "POST",
        body: {
          message: content,
          requestId,
        },
      });

      acceptingDeltas = false;
      reply.content = text;
    } catch (error) {
      acceptingDeltas = false;

      const index = messages.findIndex((item) => item.id === replyId);

      if (index !== -1 && messages[index]?.content === "") {
        messages.splice(index, 1);
      }

      chatError.value =
        error instanceof Error ? error.message : "发送失败，请稍后重试";
    } finally {
      clearTimeout(readyTimer);
      if (source) {
        source.onerror = null;
      }
      source?.close();

      if (activeSource === source) {
        activeSource = null;
      }

      sending.value = false;
      streamNotice.value = "";
    }
  };

  const models = ref<ModelOption[]>([]);
  const currentModel = ref<ModelOption | null>(null);
  const selectedModel = ref<ModelOption | null>(null);

  const modelsLoading = ref(false);
  const switchingModel = ref(false);
  const modelError = ref("");

  const getModels = async () => {
    if (!canLoadModels.value) {
      return;
    }

    modelError.value = "";
    modelsLoading.value = true;
    try {
      const response = await $fetch("/api/models");
      models.value = response.models ?? [];
      currentModel.value = response.currentModel ?? null;

      selectedModel.value =
        models.value.find(
          (model) =>
            model.provider === currentModel.value?.provider &&
            model.id === currentModel.value?.id,
        ) ?? null;
    } catch (error) {
      console.error("获取模型失败:", error);

      if (error instanceof Error) {
        modelError.value = error.message;
      } else {
        modelError.value = "获取模型失败,请稍后重试";
      }
    } finally {
      modelsLoading.value = false;
    }
  };

  const applyModel = async () => {
    // 保存目标切换模型
    const target = selectedModel.value;
    if (!target || !canApplyModel.value) {
      return;
    }

    // 清空旧错误
    modelError.value = "";
    // 设置模型切换中的状态
    switchingModel.value = true;

    try {
      // 调用接口
      const response = await $fetch("/api/model", {
        method: "POST",
        body: {
          provider: target.provider,
          id: target.id,
        },
      });

      currentModel.value = response.currentModel;
    } catch (error) {
      console.error("应用失败:", error);

      if (error instanceof Error) {
        modelError.value = error.message;
      } else {
        modelError.value = "应用失败,请稍后重试";
      }
    } finally {
      switchingModel.value = false;
    }
  };

  const historyLoading = ref(true);
  const historyError = ref("");
  const loadHistory = async () => {
    historyLoading.value = true;
    historyError.value = "";
    try {
      const response = await $fetch("/api/messages");

      messages.splice(0, messages.length, ...response.messages);
    } catch (error) {
      console.error("获取历史消息失败:", error);

      if (error instanceof Error) {
        historyError.value = error.message;
      } else {
        historyError.value = "获取历史消息失败,请稍后重试";
      }
    } finally {
      historyLoading.value = false;
    }
  };

  const canSend = computed(() => {
    return !sending.value && !historyLoading.value && !switchingModel.value;
  });

  const canLoadModels = computed(() => {
    return !modelsLoading.value && !switchingModel.value;
  });

  const canSelectModel = computed(() => {
    return !sending.value && !modelsLoading.value && !switchingModel.value;
  });

  const canApplyModel = computed(() => {
    return selectedModel.value !== null && canSelectModel.value;
  });

  return {
    // 聊天
    message,
    messages,
    sending,
    chatError,
    streamNotice,

    // 历史
    historyLoading,
    historyError,

    // 模型
    models,
    currentModel,
    selectedModel,
    modelsLoading,
    switchingModel,
    modelError,

    // 操作
    send,
    getModels,
    applyModel,
    loadHistory,

    canSend,
    canLoadModels,
    canSelectModel,
    canApplyModel,
  };
}
