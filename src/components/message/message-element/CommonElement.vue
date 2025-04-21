<template>
  <div class="common-element-wrapper">
    <div class="content">
      {{ message.ccontent }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { Message } from "../../../api/type";

// Props definition
const props = defineProps<{
  message: Message;
}>();
</script>

<style lang="scss" scoped>
.common-element-wrapper {
  padding: 0;

  .content {
    font-size: 14px;
    line-height: 1.6;
    color: #303133;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
