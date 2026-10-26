<script setup lang="ts">
import { usePiSession } from "../composables/usePiSession";
const {
  message,
  messages,
  sending,
  chatError,
  streamNotice,
  historyLoading,
  historyError,
  models,
  currentModel,
  selectedModel,
  modelsLoading,
  switchingModel,
  modelError,
  send,
  getModels,
  applyModel,
  loadHistory,
  canSend,
  canLoadModels,
  canSelectModel,
  canApplyModel,
} = usePiSession();
onMounted(() => {
  loadHistory();
});
</script>

<template>
  <main class="mx-auto max-w-2xl space-y-4 p-6">
    <h1 class="text-2xl font-bold">Pi Reader</h1>

    <ChatInput
      v-model="message"
      :sending="sending"
      :can-send="canSend"
      :error="chatError"
      @send="send()"
    />

    <ChatMessage
      :messages="messages"
      :loading="historyLoading"
      :error="historyError"
      :stream-notice="streamNotice"
    />

    <ModelSelect
      v-model="selectedModel"
      :models="models"
      :current-model="currentModel"
      :models-loading="modelsLoading"
      :switching-model="switchingModel"
      :can-load="canLoadModels"
      :can-select="canSelectModel"
      :can-apply="canApplyModel"
      :error="modelError"
      @load="getModels()"
      @apply="applyModel()"
    />
  </main>
</template>
