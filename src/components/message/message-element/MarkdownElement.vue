<template>
  <div :id="`markdown-element-${message.ccontentid}`">
    <div class="think-toggle-btn" @click="toggleThink()">
      <i class="icon-point"></i>
      <span class="think-btn-text">{{ thinkBtnText }}</span>
      <i :class="btnIcon"></i>
    </div>
    <McMarkdownCard
      :enableThink="true"
      :content="message.ccontent"
    ></McMarkdownCard>
  </div>
</template>
<script setup lang="ts">
import { ref, defineExpose, onMounted, onBeforeMount } from "vue";
import { Message, MessageStatus } from "../../../api/type";

const props = defineProps<{
  message: Message;
}>();

const isLoading = ref(false);
let interval = null;
const thinkBtnText = ref(
  `${
    props.message.cstatus === MessageStatus.SENDING ? "正在思考" : "已深度思考"
  }`
);
const btnIcon = ref("icon-chevron-up-2");

// Method to update the think button text
const updateThinkBtnText = ({
  detail,
}: {
  detail: { messageId: string; text: string };
}) => {
  console.log("updateThinkBtnText", detail);
  const targetNode = document.querySelector(`#msg-${props.message.ccontentid}`);
  if (targetNode) {
    debugger;
    const thinkBtn = targetNode.querySelector(".think-btn-text");
    if (thinkBtn) {
      (thinkBtn as HTMLElement).innerText = detail.text;
    }
  }
};

const toggleThink = () => {
  if (isLoading.value) {
    return;
  }
  const targetNode = document.querySelector(`#msg-${props.message.ccontentid}`);
  if (targetNode) {
    const thinkBlock = targetNode.querySelector(".mc-think-block");
    if (thinkBlock) {
      const currentDisplay = getComputedStyle(thinkBlock).display;
      // Fix: Cast Element to HTMLElement to avoid TS error
      (thinkBlock as HTMLElement).style.display =
        currentDisplay === "none" ? "block" : "none";
      btnIcon.value =
        currentDisplay === "none" ? "icon-chevron-up-2" : "icon-chevron-down-2";
    }
  }
};

onMounted(() => {
  window.addEventListener("externalEvent", updateThinkBtnText);
});
onBeforeMount(() => {
  window.removeEventListener("externalEvent", updateThinkBtnText);
});

// Expose the method to be accessible from outside components
defineExpose({
  updateThinkBtnText,
});
</script>

<style lang="scss" scoped>
.btn-container {
  display: flex;
  justify-content: end;
  margin-bottom: 12px;
}
</style>

<style lang="scss">
@import "devui-theme/styles-var/devui-var.scss";
.think-toggle-btn {
  display: flex;
  gap: 8px;
  align-items: center;
  border-radius: 10px;
  padding: 7px 10px;
  margin-bottom: 12px;
  width: fit-content;
  cursor: pointer;
  background-color: $devui-area;
  &:hover {
    background-color: var(--devui-btn-common-bg-hover);
  }
}
// 思考过程默认收起
.mc-think-block {
  display: none;
}
</style>

function beforeUnmount(arg0: () => void) { throw new Error("Function not
implemented."); }
