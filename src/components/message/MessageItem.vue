<template>
  <div class="message-item" :class="messageClass">
    <!-- User Message -->
    <McBubble
      :id="'msg-' + message.ccontentid"
      v-if="message.crole === 'user'"
      :content="message.ccontent"
      :align="'right'"
      :loading="message.loading"
      :avatarConfig="{
        imgSrc: 'https://matechat.gitcode.com/png/demo/userAvatar.svg',
      }"
    >
      <template #status v-if="message.cstatus !== 'success'">
        <div class="message-status">
          <span v-if="message.cstatus === 'sending'">发送中...</span>
          <span v-else-if="message.cstatus === 'fail'" class="error-status"
            >发送失败</span
          >
          <span v-else-if="message.cstatus === 'stopped'" class="warning-status"
            >已停止</span
          >
        </div>
      </template>
    </McBubble>

    <!-- Assistant Message -->
    <McBubble
      :id="'msg-' + message.ccontentid"
      v-else-if="message.crole === 'assistant'"
      :loading="message.loading"
      :avatarConfig="{ imgSrc: 'https://matechat.gitcode.com/logo.svg' }"
    >
      <!-- Dynamic component based on message type -->
      <component :is="messageComponent" :message="message" />

      <!-- Loading state for assistant messages -->
      <template #status v-if="message.cstatus === 'sending'">
        <div class="message-status">
          <span class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      </template>
    </McBubble>

    <!-- Hidden or Tip messages not rendered -->
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";
import { MessageType, MessageStatus, type Message } from "../../api/type";

// Import message components dynamically
const WelcomeElement = defineAsyncComponent(
  () => import("./message-element/WelcomeElement.vue")
);
const GuideElement = defineAsyncComponent(
  () => import("./message-element/GuideElement.vue")
);
const ConfirmTicketElement = defineAsyncComponent(
  () => import("./message-element/ConfirmTicketElement.vue")
);
const TicketListElement = defineAsyncComponent(
  () => import("./message-element/TicketListElement/index.vue")
);
const MarkdownElement = defineAsyncComponent(
  () => import("./message-element/MarkdownElement.vue")
);
const CommonElement = defineAsyncComponent(
  () => import("./message-element/CommonElement.vue")
);

// Props definition
const props = defineProps<{
  message: Message;
}>();

// Component mapping based on message type
const messageComponentMap = {
  [MessageType.WELCOME]: WelcomeElement,
  [MessageType.GUIDE]: GuideElement,
  [MessageType.CONFIRMTICKET]: ConfirmTicketElement,
  [MessageType.TICKETLIST]: TicketListElement,
  [MessageType.MARKDOWN]: MarkdownElement,
  [MessageType.COMMON]: CommonElement,
};

// Get the component to render based on message type
const messageComponent = computed(() => {
  if (
    props.message.ctype in messageComponentMap &&
    props.message.ctype !== MessageType.HIDDEN &&
    props.message.ctype !== MessageType.TIP
  ) {
    return messageComponentMap[props.message.ctype];
  }
  // Default to CommonElement if no specific component or hidden/tip type
  return CommonElement;
});

// CSS classes for the message
const messageClass = computed(() => {
  const classes: string[] = [props.message.crole];

  if (props.message.ctype) {
    classes.push(`type-${props.message.ctype}`);
  }

  if (props.message.cstatus) {
    classes.push(`status-${props.message.cstatus}`);
  }

  return classes;
});
</script>

<style scoped>
.message-item {
  margin-bottom: 16px;
}

.message-status {
  font-size: 12px;
  margin-top: 4px;
  color: #888;
}

.error-status {
  color: #ff4d4f;
}

.warning-status {
  color: #faad14;
}

.typing-indicator {
  display: inline-flex;
  align-items: center;
}

.dot {
  width: 6px;
  height: 6px;
  margin: 0 2px;
  background-color: #bbb;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}
</style>
