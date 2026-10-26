<script setup lang="ts">
import type { ChatMessage } from "#shared/types/pi-session";

defineProps<{
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  streamNotice: string;
}>();
</script>

<template>
  <section class="space-y-3" aria-label="对话消息">
    <p v-if="loading" role="status">正在加载历史消息……</p>

    <p v-if="error" role="alert" class="text-red-500">
      {{ error }}
    </p>

    <p v-if="!loading && !error && messages.length === 0">
      还没有消息，发送一条开始对话。
    </p>

    <div v-for="row in messages" :key="row.id">
      <p class="whitespace-pre-wrap">{{ row.role }}: {{ row.content }}</p>
    </div>

    <p v-if="streamNotice" role="status" class="text-amber-600">
      {{ streamNotice }}
    </p>
  </section>
</template>
