<template>
  <div class="guide-element-wrapper">
    <div class="title">
      <i class="el-icon-tickets title-icon"></i>
      <span>{{ messageContent.title }}</span>
    </div>
    <div class="content">
      <span>{{ messageContent.content }}</span>
    </div>
    <div
      class="optional-actions"
      v-if="messageContent.examples && messageContent.examples.length > 0"
    >
      <span class="optional-actions-tip">您可以试着向我发送以下内容</span>
      <div class="actions">
        <div
          class="action-item"
          v-for="example of messageContent.examples"
          :key="example"
          @click="handleExampleClick(example)"
        >
          <span>{{ example }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from "vue";
import { Message } from "../../../api/type";
import mitt from "mitt";

interface GuideContent {
  title: string;
  content: string;
  examples?: string[];
}

// Get global event bus instance
const emitter = mitt();

export default defineComponent({
  name: "GuideElement",
  props: {
    message: {
      type: Object as PropType<Message>,
      required: true,
    },
  },
  setup(props) {
    const messageContent = computed<GuideContent>(() => {
      if (
        typeof props.message.ccontent === "string" &&
        props.message.ccontent
      ) {
        try {
          return JSON.parse(props.message.ccontent) as GuideContent;
        } catch (e) {
          console.error("Failed to parse message content:", e);
          return { title: "", content: "" };
        }
      }
      // Handle the case where ccontent is not a string
      const content = props.message.ccontent as unknown;
      return (
        typeof content === "object" && content !== null
          ? content
          : { title: "", content: "" }
      ) as GuideContent;
    });

    const handleExampleClick = (example: string) => {
      // Using mitt for event emission instead of $bus
      emitter.emit("setSendMsg", { val: example });
    };

    return {
      messageContent,
      handleExampleClick,
    };
  },
});
</script>

<style lang="scss" scoped>
.guide-element-wrapper {
  padding: 16px 24px;
  border-radius: 8px 8px 8px 8px;
  .title {
    margin-bottom: 8px;
    font-weight: 600;
    color: #282828;
    .title-icon {
      display: inline-block;
      color: #3181ff;
      margin-right: 8px;
    }
  }
  .content,
  .optional-actions {
    font-size: 14px;
    color: #282828;
    line-height: 24px;
  }
  .optional-actions {
    margin-top: 15px;
    .optional-actions-tip {
      display: block;
      margin-bottom: 10px;
    }
    .actions .action-item {
      display: flex;
      align-items: center;
      padding: 6px 16px;
      background: #f0f3fd;
      border-radius: 4px 4px 4px 4px;
      cursor: pointer;
      &:not(:last-child) {
        margin-bottom: 8px;
      }
      .item-icon {
        height: 16px;
        width: 16px;
        margin-right: 8px;
      }
    }
  }
}
</style>
