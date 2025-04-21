<template>
  <div class="message-list-container" ref="messageListRef">
    <template v-for="(msg, idx) in messages" :key="idx">
      <MessageItem :message="msg" />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, onMounted, watch, ref, defineComponent } from "vue";
import { useConversationStore } from "../../stores/conversation";
import MessageItem from "./MessageItem.vue";

export default defineComponent({
  name: "MessageList",
  components: {
    MessageItem,
  },
  setup() {
    const conversationStore = useConversationStore();
    const messages = computed(() => conversationStore.currentMessageList);
    const messageListRef = ref<HTMLDivElement | null>(null);

    // Scroll to bottom when messages change
    watch(
      () => messages.value.length,
      () => {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    );

    // Scroll to bottom when component is mounted
    onMounted(() => {
      scrollToBottom();
    });

    const scrollToBottom = () => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
      }
    };

    return {
      messages,
      messageListRef,
    };
  },
});
</script>

<style scoped>
.message-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 16px;
  height: 100%;
}
</style>
