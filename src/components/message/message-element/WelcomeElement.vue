<template>
  <div class="welcome-element-wrapper">
    <div class="title">{{ title || "您好，我是您的AI财务助手" }}</div>
    <div class="content">
      <slot name="content">
        <span>我可以高效地帮助您执行以下操作：</span><br />
        <span>创建申请单…</span><br />
        <span>查询申请单…</span>
      </slot>
    </div>
    <div class="optional-actions">
      <span class="optional-actions-tip">{{
        actionsTip || "高效操作，一触即发："
      }}</span>
      <div class="actions">
        <div
          v-for="action in actions"
          :key="action.type"
          class="action-item"
          @click="handleActionItemClick(action.type)"
          :class="{ disabled: isReceivingMessage }"
        >
          <img
            v-if="action.iconSrc"
            class="item-icon"
            :src="action.iconSrc"
            :alt="action.alt || action.text"
          />
          <span>{{ action.text }}</span>
        </div>

        <!-- Fallback action item if no actions provided -->
        <div
          v-if="!actions.length"
          class="action-item"
          @click="handleActionItemClick('createTicket')"
          :class="{ disabled: isReceivingMessage }"
        >
          <img
            class="item-icon"
            src="../../../../assets/images/create-conversation.svg"
            alt="创建申请单"
          />
          <span>请帮我创建差旅申请单</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch } from "vue";
import { MessageRole, MessageStatus, MessageType } from "../../../api/type";
import { useConversationStore } from "../../../stores/conversation";

// Define available actions
type ActionType = "createTicket" | "queryTicket" | string;

// Define action item interface
interface ActionItem {
  type: ActionType;
  text: string;
  iconSrc?: string;
  alt?: string;
}

// Define event bus type
interface EventBus {
  $emit: (event: string, ...args: any[]) => void;
  $on: (event: string, callback: Function) => void;
}

// Define props
const props = withDefaults(
  defineProps<{
    title?: string;
    actionsTip?: string;
    actions?: ActionItem[];
    showErrorMessages?: boolean;
  }>(),
  {
    showErrorMessages: true,
    actions: () => [],
  }
);

// Define emits
const emit = defineEmits<{
  (e: "action-click", action: ActionType): void;
  (e: "error", message: string): void;
}>();

// Get the conversation store
const conversationStore = useConversationStore();

// Get event bus from app with proper typing
const $bus = inject<EventBus>("$bus");

// Reactive state
const error = ref<string | null>(null);

// Computed properties
const isReceivingMessage = computed(() => {
  const currentMessageList = conversationStore.currentMessageList;
  const receivingStatus = [MessageStatus.UNSEND, MessageStatus.SENDING];

  return (
    currentMessageList.length > 0 &&
    receivingStatus.includes(
      currentMessageList[currentMessageList.length - 1].cstatus
    )
  );
});

// Watch for errors and emit them
watch(error, (newError) => {
  if (newError && props.showErrorMessages) {
    emit("error", newError);
  }
});

// Methods
/**
 * Creates a message for a create ticket action
 * @returns A message object
 */
const createTicketMessage = () => {
  return {
    id: new Date().getTime() + 1,
    type: MessageType.GUIDE,
    role: MessageRole.ASSISTANT,
    content: {
      title: "创建差旅申请单",
      content:
        "您可以向我描述此次出差预计的时间、出差地点、乘坐交通工具等信息，我们将为您创建申请单...",
      examples: [
        "我明天乘坐高铁去上海出差参加会议，后天乘坐高铁回北京。",
        "下周一计划去石家庄参加公司培训，坐火车去，预计三天回来",
      ],
    },
    status: MessageStatus.SENDING,
    // Add required properties for Message interface
    csessionid:
      conversationStore.currentConversation?.id || Date.now().toString(),
    ccontent: "",
    crole: MessageRole.ASSISTANT,
    ctype: MessageType.GUIDE,
    cstatus: MessageStatus.SENDING,
  };
};

/**
 * Handle action item click event
 * @param action The action type to handle
 */
const handleActionItemClick = (action: ActionType) => {
  // Reset error state
  error.value = null;

  // Emit the action click event
  emit("action-click", action);

  if (isReceivingMessage.value) {
    const errorMsg = "正在处理中，请稍后再试";
    error.value = errorMsg;

    // Check if $bus exists before calling methods on it
    if ($bus) {
      $bus.$emit("showChatTipMessage", errorMsg);
    }
    return;
  }

  try {
    if (action === "createTicket") {
      const message = createTicketMessage();

      // Check if $bus exists before calling methods on it
      if ($bus) {
        $bus.$emit("pushMessageList", message);
      } else {
        throw new Error("Event bus not available");
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
    console.error(`Error handling action ${action}:`, err);
  }
};

// Expose component methods for parent components
defineExpose({
  handleActionItemClick,
  isReceivingMessage,
});
</script>

<style lang="scss" scoped>
.welcome-element-wrapper {
  padding: 16px 24px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .title {
    margin-bottom: 12px;
    font-weight: 600;
    font-size: 16px;
    color: #282828;
  }

  .content,
  .optional-actions {
    font-size: 14px;
    color: #282828;
    line-height: 24px;
  }

  .optional-actions {
    margin-top: 18px;

    .optional-actions-tip {
      display: block;
      margin-bottom: 10px;
      font-weight: 500;
      color: #555;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .action-item {
        display: flex;
        align-items: center;
        height: 36px;
        padding: 0 16px;
        background: #f0f3fd;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;

        &:hover {
          background: #e0e6fa;
          transform: translateY(-1px);
        }

        &:active {
          transform: translateY(0);
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;
          pointer-events: none;

          &:hover {
            background: #f0f3fd;
            transform: none;
          }
        }

        .item-icon {
          height: 16px;
          width: 16px;
          margin-right: 8px;
          object-fit: contain;
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .welcome-element-wrapper {
    padding: 12px 16px;

    .title {
      font-size: 15px;
    }

    .content,
    .optional-actions {
      font-size: 13px;
    }

    .optional-actions .actions .action-item {
      height: 32px;
    }
  }
}
</style>
