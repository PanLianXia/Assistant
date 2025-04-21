<template>
  <div class="chat-container">
    <div class="chat-messages">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="message.role"
      >
        <div class="message-content">
          <strong>{{ message.role === "user" ? "You" : "Assistant" }}:</strong>
          <p>{{ message.content }}</p>
        </div>
      </div>
      <div v-if="isStreaming" class="message assistant">
        <div class="message-content">
          <strong>Assistant:</strong>
          <p>{{ streamingContent }}</p>
        </div>
      </div>
    </div>
    <div class="chat-input">
      <input
        v-model="userInput"
        @keyup.enter="sendMessage"
        placeholder="Type your message here..."
        :disabled="isStreaming"
      />
      <button @click="sendMessage" :disabled="isStreaming || !userInput.trim()">
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { chat } from "../utils/chat";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const userInput = ref("");
const streamingContent = ref("");
const isStreaming = ref(false);
const messages = reactive<Message[]>([]);

// Chat context to track the conversation
const chatContext = reactive({
  currentMessageList: [] as any[],
});

const sendMessage = async () => {
  const userMessage = userInput.value.trim();
  if (!userMessage || isStreaming.value) return;

  // Add user message to the display
  messages.push({
    role: "user",
    content: userMessage,
  });

  // Clear input and prepare for streaming
  userInput.value = "";
  isStreaming.value = true;
  streamingContent.value = "";

  // Prepare a placeholder for the assistant response
  const assistantMessageIndex = chatContext.currentMessageList.length;
  chatContext.currentMessageList.push({
    role: "assistant",
    content: "",
  });

  // Call the handleChatMessageStream function
  await chat.handleChatMessageStream(chatContext, userMessage, {
    onMessage: (message) => {
      streamingContent.value += message.answer || "";
      chatContext.currentMessageList[assistantMessageIndex].content +=
        message.answer || "";
    },
    onError: (error: any) => {
      console.error("Error in chat stream:", error);
      streamingContent.value += "\n[Error occurred during streaming]";
      isStreaming.value = false;
    },
    onFinish: () => {
      // Add the complete streamed message to the messages list
      messages.push({
        role: "assistant",
        content: streamingContent.value,
      });
      isStreaming.value = false;
    },
  });
};
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f8f9fa;
}

.message {
  padding: 10px 14px;
  border-radius: 8px;
  max-width: 80%;
  word-wrap: break-word;
}

.user {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
}

.assistant {
  align-self: flex-start;
  background-color: #e9ecef;
  color: #212529;
}

.message-content p {
  margin: 4px 0 0 0;
}

.chat-input {
  display: flex;
  padding: 12px;
  background-color: white;
  border-top: 1px solid #ddd;
}

.chat-input input {
  flex-grow: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
}

.chat-input button {
  padding: 10px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chat-input button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}
</style>
