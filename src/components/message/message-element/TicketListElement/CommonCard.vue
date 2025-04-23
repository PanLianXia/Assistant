<template>
  <div>
    <div class="row">
      <div class="ticket-template">{{ ticket.ctemplateid_name }}</div>
      <div class="ticket-itotalamt">{{ ticket.itotalamt }}</div>
    </div>
    <div class="row">
      <div class="ticket-date">日期：{{ ticket.ddate }}</div>
    </div>
    <div class="row">
      <div class="ticket-reason">事由：{{ ticket.creason_name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 使用defineProps代替props选项
defineProps({
  ticket: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped lang="scss">
.row {
  .ticket-template {
    margin-right: 50px;
  }
}
.row {
  &:first-child {
    display: flex;
    justify-content: space-between;
  }
  &:not(:first-child) {
    margin-top: 3px;
  }
}
</style>
