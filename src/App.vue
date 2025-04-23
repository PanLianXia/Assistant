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
        :selectedValue="selectedExtension?.value"
        :direction="introPrompt.direction"
        class="intro-prompt"
        @itemClick="handleToolBarClick($event)"
      ></McPrompt>
    </McLayoutContent>
    <McLayoutContent class="content-container" v-else>
      <MessageList />
    </McLayoutContent>
    <div class="shortcut" style="display: flex; align-items: center; gap: 8px">
      <McPrompt
        v-if="!startPage"
        :list="introPrompt.list"
        :selectedValue="selectedExtension?.value"
        :direction="'horizontal'"
        style="flex: 1"
        @itemClick="handleToolBarClick($event)"
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
import { onMounted, ref, watch } from "vue";
import { Button } from "vue-devui/button";
import "vue-devui/button/style.css";
import { MessageRole, MessageStatus, MessageType } from "./api/type";
import MessageList from "./components/message/MessageList.vue";
import { useConversationStore } from "./stores/conversation";
import { getAIAnswer } from "./utils/chat";

import McPrompt from "./components/Prompt/Prompt.vue";

import BackgroundService from "./services/background";
import { addMessage } from "./api";

const backgroundService = new BackgroundService();

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
const selectedExtension = ref<any>(null);
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
      value: "createTicket",
      label: "创建出差申请单",
      extentionName: "SQ01填写出差申请单",
      iconConfig: { name: "icon-info-o", color: "#5e7ce0" },
      messageSendBoxPlaceholder: "输入出差关键信息，自动创建出差申请单",
    },
    {
      value: "companyRule",
      label: "公司规章制度",
      iconConfig: { name: "icon-star", color: "rgb(255, 215, 0)" },
      extentionName: "RAG01公司规章制度",
      messageSendBoxPlaceholder:
        "输入公司规章制度关键信息，自动查询公司规章制度",
    },
    {
      value: "expenseReport",
      label: "差旅报销单",
      extentionName: "BX01差旅报销单相关信息描述",
      iconConfig: { name: "icon-priority", color: "#3ac295" },
      messageSendBoxPlaceholder: "输入差旅报销单关键信息，自动查询差旅报销单",
    },
    {
      value: "queryTicket",
      label: "查询单据",
      extentionName: "SEARCH01查询用户的单据",
      iconConfig: { name: "icon-priority", color: "#3ac295" },
      messageSendBoxPlaceholder: "输入查询关键信息，自动查询申请单",
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

const backgroundInfo = ref("");

onMounted(async () => {
  backgroundInfo.value = await backgroundService.getBackground();
});

const handleToolBarClick = (evt: any) => {
  // 如果点击的工具与当前选中的工具相同，则取消选中
  if (selectedExtension.value?.extentionName === evt.extentionName) {
    selectedExtension.value = null;
    conversationStore.currentQueryClassName = "";
    return;
  }

  // 选中工具
  selectedExtension.value = evt;
  conversationStore.currentQueryClassName = evt.extentionName;
};

const newConversation = () => {
  conversationStore.createNewConversation();
};

const onSubmit = (evt: any) => {
  debugger;
  if (!evt) return;
  let content = typeof evt === "string" ? evt : inputValue.value;
  inputValue.value = "";

  if (!content.trim()) return;

  // If there's no current conversation, create one
  if (!conversationStore.currentConversation) {
    conversationStore.createNewConversation();
  }

  // Create user message
  const userMessage = {
    csessionid:
      conversationStore.currentConversation?.id || Date.now().toString(),
    ccontent: content,
    crole: MessageRole.USER,
    ctype: MessageType.COMMON,
    cstatus: MessageStatus.SENDING,
    loading: false,
  };

  // Add message to store
  conversationStore.addMessage(userMessage);
  addMessage(userMessage);

  // Simulate an assistant response (this would be replaced with actual API call)
  setTimeout(() => {
    // Update user message status
    userMessage.cstatus = MessageStatus.SUCCESS;

    // Create assistant message
    // const assistantMessage = {
    //   csessionid:
    //     conversationStore.currentConversation?.id || Date.now().toString(),
    //   ccontent: `你好，我收到了你的消息: "${content}"`,
    //   crole: "assistant" as "assistant",
    //   ctype: MessageType.MARKDOWN,
    //   cstatus: MessageStatus.SUCCESS,
    // };

    // Add response to store
    // conversationStore.addMessage(assistantMessage);
    getAIAnswer(
      {
        inputs: {
          data: JSON.stringify({
            backgroundInfo: backgroundInfo.value,
          }),
          ext: conversationStore.currentQueryClassName,
        },
        query: content,
      },
      ({
        messageData,
        messageType,
      }: {
        messageData: any;
        messageType: string;
      }) => {
        debugger;
        conversationStore.addMessage({
          ccontent: messageData,
          crole: MessageRole.ASSISTANT,
          ctype: messageType as MessageType,
          cstatus: MessageStatus.SUCCESS,
          loading: false,
        });
        // 调用markdownElement中暴露出的方法
      }
    );
  }, 100);

  // 调用markdownElement中暴露出的方法
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
