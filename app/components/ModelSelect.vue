<script setup lang="ts">
import type { ModelOption } from "#shared/types/pi-session";

const selectedModel = defineModel<ModelOption | null>({
  required: true,
});

defineProps<{
  models: ModelOption[];
  currentModel: ModelOption | null;
  modelsLoading: boolean;
  switchingModel: boolean;
  canLoad: boolean;
  canSelect: boolean;
  canApply: boolean;
  error: string;
}>();

const emit = defineEmits<{
  load: [];
  apply: [];
}>();
</script>

<template>
  <section class="space-y-3" aria-label="模型选择">
    <p>当前模型：{{ currentModel?.name ?? "暂无" }}</p>

    <UButton
      @click="emit('load')"
      :disabled="!canLoad"
      :loading="modelsLoading"
    >
      获取模型
    </UButton>

    <select v-model="selectedModel" :disabled="!canSelect">
      <option :value="null" disabled>请选择模型</option>

      <option
        v-for="model in models"
        :key="`${model.provider}/${model.id}`"
        :value="model"
      >
        {{ model.provider }} / {{ model.name }}
      </option>
    </select>

    <p>已选择：{{ selectedModel?.name ?? "暂无" }}</p>

    <p v-if="error" role="alert" class="text-red-500">
      {{ error }}
    </p>

    <UButton
      @click="emit('apply')"
      :disabled="!canApply"
      :loading="switchingModel"
    >
      应用模型
    </UButton>
  </section>
</template>
