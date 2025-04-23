import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Conversation, Message } from '../api/type'

export const useConversationStore = defineStore('conversation', () => {
  // State
  const difyConversationId = ref('')   // 对话ID
  const currentQueryClassName = ref('')   // 问题分类
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
		console.log(message)
    const addMessageObj = {
      ...message,
      csessionid: currentConversation.value?.id || ''
    }
    currentMessageList.value.push(addMessageObj)
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
    difyConversationId,
    currentQueryClassName,
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