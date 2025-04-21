import { defineStore } from 'pinia'
import { ref } from 'vue'

export enum MessageType {
    WELCOME = 'welcome',             // 欢迎语，不保存
    GUIDE = 'guide',                 // 引导语
    CONFIRMTICKET = 'confirmTicket', // 确认单据卡片
    TICKETLIST = 'ticketList',       // 单据列表
    COMMON = 'common',                // 普通消息
    MARKDOWN = 'markdown',           // Markdown 格式消息
    HIDDEN = 'hidden',               // 隐藏消息
    TIP = 'tip'  // 提示消息，不保存
}

export enum MessageStatus {
	UNSEND = 'UnSend',       // 未发送
    SENDING = 'sending',     // 正在发送
    SUCCESS ='success',     // 发送成功
    FAIL = 'fail',           // 发送失败
    STOPPED = 'stopped',     // 停止发送
}

export interface Message {
  ccontentid?: string
  csessionid: string,
  ccontent: string,
  crole: 'user' | 'assistant'
  ctype: MessageType,
  cstatus: MessageStatus,
}

export interface Conversation {
  id: string
  title: string
  createdAt: Date
}

export const useConversationStore = defineStore('conversation', () => {
  // State
  const currentConversation = ref<Conversation | null>(null)
  const currentMessageList = ref<Message[]>([])
  const startPage = ref(true)
  const conversationList = ref<Conversation[]>([])

  // Actions
  function setCurrentConversation(conversation: Conversation | null) {
    currentConversation.value = conversation
    if (conversation) {
      startPage.value = false
    }
  }

  function addMessage(message: Message) {
    currentMessageList.value.push(message)
  }

  function clearMessages() {
    currentMessageList.value = []
  }

  function createNewConversation() {
    // Create a new conversation
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: `New Conversation ${conversationList.value.length + 1}`,
      createdAt: new Date()
    }
    
    // Add to conversation list
    conversationList.value.push(newConversation)
    
    // Set as current conversation
    setCurrentConversation(newConversation)
    
    // Clear messages
    clearMessages()
    
    // Set start page to false
    startPage.value = false
    
    return newConversation
  }

  function goToStartPage() {
    startPage.value = true
    currentConversation.value = null
  }

  return {
    // State
    currentConversation,
    currentMessageList,
    startPage,
    conversationList,
    
    // Actions
    setCurrentConversation,
    addMessage,
    clearMessages,
    createNewConversation,
    goToStartPage
  }
}) 