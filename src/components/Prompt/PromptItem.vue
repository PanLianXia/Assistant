<template>
  <div
    class="mc-prompt-item"
    :class="{ 'mc-prompt-item-selected': isSelected }"
  >
    <div :class="['mc-prompt-item-icon', { 'no-description': !prompt?.desc }]">
      <Icon v-if="prompt?.iconConfig" v-bind="prompt?.iconConfig"></Icon>
    </div>
    <div v-if="prompt?.label || prompt?.desc" class="mc-prompt-item-content">
      <div v-if="prompt?.label" class="mc-prompt-item-label">
        {{ prompt?.label }}
      </div>
      <div v-if="prompt?.desc" class="mc-prompt-item-description">
        {{ prompt?.desc }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "./components/Icon.vue";
import { promptItemProps } from "./prompt-types";

const props = defineProps(promptItemProps);

const isSelected = computed(() => {
  return props.prompt?.value === props.prompt?.selectedValue;
});
</script>

<style scoped lang="scss">
@import "devui-theme/styles-var/devui-var.scss";

.mc-prompt-item {
  display: flex;
  gap: 8px;

  .mc-prompt-item-icon.no-description {
    display: flex;
    align-items: center;
  }

  .mc-prompt-item-content {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .mc-prompt-item-label {
      font-weight: bold;
    }
    .mc-prompt-item-description {
      color: $devui-aide-text;
    }
  }
}
</style>
