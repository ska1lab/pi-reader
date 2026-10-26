<script setup lang="ts">
const message = defineModel<string>({ required: true });
defineProps<{
  sending: boolean;
  canSend: boolean;
  error: string;
}>();

const emit = defineEmits<{
  send: [];
}>();
</script>

<template>
  <section class="space-y-3" aria-label="发送消息">
    <UFormField label="消息">
      <UTextarea
        v-model="message"
        placeholder="输入你想发送给 Pi 的消息"
        class="w-full"
      />
    </UFormField>

    <p v-if="error" role="alert" class="text-red-500">
      {{ error }}
    </p>

    <UButton @click="emit('send')" :disabled="!canSend" :loading="sending">
      发送
    </UButton>
  </section>
</template>
