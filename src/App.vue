<template>
  <McLayout class="container">
    <McHeader
      :title="'MateChat'"
      :logoImg="'https://matechat.gitcode.com/logo.svg'"
    >
      <template #operationArea>
        <div class="operations">
          <i class="icon-helping"></i>
        </div>
      </template>
    </McHeader>
    <McLayoutContent
      v-if="startPage"
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
      "
    >
      <McIntroduction
        :logoImg="'https://matechat.gitcode.com/logo2x.svg'"
        :title="'MateChat'"
        :subTitle="'Hi，欢迎使用 MateChat'"
        :description="description"
      ></McIntroduction>
      <McPrompt
        :list="introPrompt.list"
        :direction="introPrompt.direction"
        class="intro-prompt"
        @itemClick="onSubmit($event.label)"
      ></McPrompt>
    </McLayoutContent>
    <McLayoutContent class="content-container" v-else>
      <MessageList />
    </McLayoutContent>
    <div class="shortcut" style="display: flex; align-items: center; gap: 8px">
      <McPrompt
        v-if="!startPage"
        :list="simplePrompt"
        :direction="'horizontal'"
        style="flex: 1"
        @itemClick="onSubmit($event.label)"
      ></McPrompt>
      <Button
        style="margin-left: auto"
        icon="add"
        shape="circle"
        title="新建对话"
        size="sm"
        @click="newConversation"
      />
    </div>
    <McLayoutSender>
      <McInput
        :value="inputValue"
        :maxLength="2000"
        @change="(e) => (inputValue = e)"
        @submit="onSubmit"
      >
        <template #extra>
          <div class="input-foot-wrapper">
            <div class="input-foot-left">
              <span v-for="(item, index) in inputFootIcons" :key="index">
                <i :class="item.icon"></i>
                {{ item.text }}
              </span>
              <span class="input-foot-dividing-line"></span>
              <span class="input-foot-maxlength"
                >{{ inputValue.length }}/2000</span
              >
            </div>
            <div class="input-foot-right">
              <Button
                icon="op-clearup"
                shape="round"
                :disabled="!inputValue"
                @click="inputValue = ''"
                >清空输入</Button
              >
            </div>
          </div>
        </template>
      </McInput>
    </McLayoutSender>
  </McLayout>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Button } from "vue-devui/button";
import "vue-devui/button/style.css";
import MessageList from "./components/message/MessageList.vue";
import { useConversationStore } from "./stores/conversation";
import { MessageType, MessageStatus } from "./stores/conversation";

const conversationStore = useConversationStore();
const startPage = ref(conversationStore.startPage);

// Watch for changes in the startPage value from the store
watch(
  () => conversationStore.startPage,
  (newValue) => {
    startPage.value = newValue;
  }
);

const inputValue = ref("");
const description = [
  "MateChat 可以辅助研发人员编码、查询知识和相关作业信息、编写文档等。",
  "作为AI模型，MateChat 提供的答案可能不总是确定或准确的，但您的反馈可以帮助 MateChat 做的更好。",
];
const inputFootIcons = [
  { icon: "icon-at", text: "智能体" },
  { icon: "icon-standard", text: "词库" },
  { icon: "icon-add", text: "附件" },
];
const introPrompt = {
  direction: "horizontal",
  list: [
    {
      value: "quickSort",
      label: "帮我写一个快速排序",
      iconConfig: { name: "icon-info-o", color: "#5e7ce0" },
      desc: "使用 js 实现一个快速排序",
    },
    {
      value: "helpMd",
      label: "你可以帮我做些什么？",
      iconConfig: { name: "icon-star", color: "rgb(255, 215, 0)" },
      desc: "了解当前大模型可以帮你做的事",
    },
    {
      value: "bindProjectSpace",
      label: "怎么绑定项目空间",
      iconConfig: { name: "icon-priority", color: "#3ac295" },
      desc: "如何绑定云空间中的项目",
    },
  ],
};
const simplePrompt = [
  {
    value: "quickSort",
    iconConfig: { name: "icon-info-o", color: "#5e7ce0" },
    label: "帮我写一个快速排序",
  },
  {
    value: "helpMd",
    iconConfig: { name: "icon-star", color: "rgb(255, 215, 0)" },
    label: "你可以帮我做些什么？",
  },
];

const newConversation = () => {
  conversationStore.createNewConversation();
};

const onSubmit = (evt: any) => {
  if (!evt) return;
  let content = typeof evt === "string" ? evt : inputValue.value;
  inputValue.value = "";

  if (!content.trim()) return;

  // Create user message
  const userMessage = {
    csessionid:
      conversationStore.currentConversation?.id || Date.now().toString(),
    ccontent: content,
    crole: "user" as "user",
    ctype: MessageType.COMMON,
    cstatus: MessageStatus.SENDING,
  };

  // Add message to store
  conversationStore.addMessage(userMessage);

  // If there's no current conversation, create one
  if (!conversationStore.currentConversation) {
    conversationStore.createNewConversation();
  }

  // Simulate an assistant response (this would be replaced with actual API call)
  setTimeout(() => {
    // Update user message status
    userMessage.cstatus = MessageStatus.SUCCESS;

    // Create assistant message
    const assistantMessage = {
      csessionid:
        conversationStore.currentConversation?.id || Date.now().toString(),
      ccontent: `你好，我收到了你的消息: "${content}"`,
      crole: "assistant" as "assistant",
      ctype: MessageType.MARKDOWN,
      cstatus: MessageStatus.SUCCESS,
    };

    // Add response to store
    conversationStore.addMessage(assistantMessage);
  }, 1000);
};
</script>

<style>
.container {
  width: 1000px;
  margin: 20px auto;
  height: calc(100vh - 40px);
  padding: 20px;
  gap: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 16px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.input-foot-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
  margin-right: 8px;
}

.input-foot-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-foot-left span {
  font-size: 12px;
  color: #252b3a;
  cursor: pointer;
}

.input-foot-dividing-line {
  width: 1px;
  height: 14px;
  background-color: #d7d8da;
}

.input-foot-maxlength {
  font-size: 12px;
  color: #71757f;
}

.input-foot-right > *:not(:first-child) {
  margin-left: 8px;
}
</style>
