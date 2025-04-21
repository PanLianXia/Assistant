<template>
  <div class="ticket-list-element-wrapper">
    <!-- <div class="title">
            <i class="el-icon-tickets title-icon"></i>
            <span>{{ message.content.title }}</span>
        </div> -->
    <div
      v-if="queryParams.conditionList && queryParams.conditionList.length > 0"
      class="condition"
    >
      <p class="condition-title">我已按照以下条件为您查询</p>
      <template
        v-for="conditionItem in queryParams.conditionList"
        :key="conditionItem.field"
      >
        <div v-if="!conditionItem.isHide" class="condition-item">
          {{ `${conditionItem.label}: ${conditionItem.showValue}` }}
        </div>
      </template>
    </div>
    <div class="content" v-loading="isQuerying">
      <!-- <div class="ticket-list-title">单据列表</div> -->
      <!-- 单据列表  开始-->
      <div v-if="ticketList.length !== 0" class="ticket-list">
        <div
          class="ticket-item"
          v-for="ticket of ticketList"
          :key="ticket.cguid"
          @click="handleTicketClick(ticket)"
        >
          <common-card :ticket="ticket"></common-card>
        </div>
      </div>
      <div v-else class="no-data">暂无数据</div>
      <!-- 单据列表  结束-->
    </div>
    <!-- 分页 开始 -->
    <div class="pagination" v-if="messageContent?.pageInfo?.pageCount > 1">
      <div class="page-info">
        {{ queryParams.pageno }} / {{ messageContent?.pageInfo?.pageCount }}
      </div>
      <div class="page-operation">
        <div
          class="operation-item prev-btn"
          @click="handleCurrentPageChange(queryParams.pageno - 1)"
        >
          <i class="el-icon-arrow-left"></i>
        </div>
        <div
          class="operation-item next-btn"
          @click="handleCurrentPageChange(queryParams.pageno + 1)"
        >
          <i class="el-icon-arrow-right"></i>
        </div>
      </div>
    </div>
    <!-- 分页 结束 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
// @ts-ignore
import CommonCard from "./CommonCard.vue";
import type { Message } from "../../../../api/type";

// Importing the ticket query module with dynamic import to avoid require
// @ts-ignore
import queryTicketsModule from "~/workflow/query/queryTickets.js";
const queryTickets = new queryTicketsModule();

// Types for the component
interface TicketItem {
  cguid: string;
  cpageid: string;
  ctemplateid: string;
  ctemplateid_name: string;
  [key: string]: any;
}

interface ConditionItem {
  field: string;
  label: string;
  showValue: string;
  isHide?: boolean;
  [key: string]: any;
}

interface QueryParams {
  entityid?: string;
  pageno: number;
  conditionList?: ConditionItem[];
  [key: string]: any;
}

interface MessageContent {
  pageInfo?: {
    pageCount: number;
    [key: string]: any;
  };
  queryParams?: QueryParams;
  ticketList?: TicketItem[];
  title?: string;
}

// Define emits for the component
const emit = defineEmits<{
  (e: "ticket-click", ticket: TicketItem): void;
  (e: "query-change", params: QueryParams): void;
  (e: "query-error", error: Error): void;
}>();

// Props declaration
const props = defineProps({
  message: {
    type: Object as () => Message,
    required: true,
  },
});

// Reactive state
const ticketList = ref<TicketItem[]>([]);
const queryParams = ref<QueryParams>({ pageno: 1 });
const isQuerying = ref(false);
const queryError = ref<Error | null>(null);

// Computed properties
const messageContent = computed<MessageContent>(() => {
  if (typeof props.message.ccontent === "string" && props.message.ccontent) {
    try {
      return JSON.parse(props.message.ccontent);
    } catch (e) {
      console.error("Error parsing message content:", e);
      return {};
    }
  }
  return (props.message.ccontent as MessageContent) || {};
});

// Watch for message content changes
watch(
  () => props.message.ccontent,
  () => {
    updateFromMessageContent();
  },
  { immediate: false }
);

// Methods
/**
 * Update component state from message content
 */
const updateFromMessageContent = () => {
  if (messageContent.value.ticketList) {
    ticketList.value = messageContent.value.ticketList;
  }

  if (messageContent.value.queryParams) {
    queryParams.value = messageContent.value.queryParams;
  }
};

/**
 * 获取单据列表
 */
const getTicketList = async () => {
  isQuerying.value = true;
  queryError.value = null;

  try {
    const ticketListResult = await queryTickets.queryTicketList(
      queryParams.value
    );

    // Emit query params change
    emit("query-change", { ...queryParams.value });

    if (
      queryParams.value.entityid &&
      ticketListResult[queryParams.value.entityid]
    ) {
      ticketList.value = ticketListResult[queryParams.value.entityid];
    } else {
      ticketList.value = [];
    }
  } catch (error) {
    console.error("Failed to fetch ticket list:", error);
    ticketList.value = [];
    queryError.value =
      error instanceof Error ? error : new Error(String(error));
    emit("query-error", queryError.value);
  } finally {
    isQuerying.value = false;
  }
};

/**
 * 翻页
 */
const handleCurrentPageChange = async (pageno: number) => {
  if (!messageContent.value.pageInfo) return;

  if (pageno < 1) {
    pageno = 1;
  } else if (pageno > messageContent.value.pageInfo.pageCount) {
    pageno = messageContent.value.pageInfo.pageCount;
  }

  if (pageno === queryParams.value.pageno) {
    return;
  }

  queryParams.value.pageno = pageno;
  await getTicketList();
};

/**
 * 跳转到单据详情页面
 */
const handleTicketClick = (ticket: TicketItem) => {
  // Emit the ticket click event
  emit("ticket-click", ticket);

  const {
    cpageid,
    ctemplateid: cpagetemplateid,
    ctemplateid_name: cpagetemplatename,
    cguid,
  } = ticket;

  if (typeof window.plus !== "undefined" && window.plus) {
    window.uni.navigateTo({
      url: `/components/apaas-mobile/template/common-vchr?pageid=${cpageid}&templateId=${cpagetemplateid}&cguid=${cguid}&islistdbclick=2`,
    });
  } else {
    const mainWindow = window.parent ? window.parent : window;
    mainWindow.location.href =
      mainWindow.location.pathname +
      `#/page/commonvchr/${cpageid}/${cpagetemplateid}/${cguid}?name=${cpagetemplatename}`;
  }
};

// Expose methods for parent components
defineExpose({
  getTicketList,
  handleCurrentPageChange,
});

// Lifecycle hooks
onMounted(() => {
  updateFromMessageContent();
});

// Making window.plus and window.uni available in TypeScript
declare global {
  interface Window {
    plus?: any;
    uni?: any;
  }
}
</script>

<style scoped lang="scss">
.ticket-list-element-wrapper {
  min-width: 270px;
  padding: 16px 24px;
  font-size: 14px;
  box-sizing: border-box;
  .title {
    font-weight: 600;
  }
  .condition {
    margin-bottom: 14px;
    .condition-title {
      padding: 3px 5px;
      margin-bottom: 10px;
      background-color: #f1f1f1;
      color: #969696;
    }
    .condition-item {
      color: #000;
    }
  }
  .content {
    .ticket-list-title {
      color: #000;
    }
    .ticket-list {
      max-height: 500px;
      margin: 10px 0 15px 0;
      font-size: 13px;
      overflow-y: auto;
      scrollbar-width: none; /* Firefox */
      -ms-overflow-style: none; /* IE and Edge */
      &::-webkit-scrollbar-track {
        display: none;
      }
      .ticket-item {
        padding: 8px 5px;
        border-bottom: 1px solid rgba(5, 5, 5, 0.06);
        cursor: pointer;
        &:first-child {
          padding-top: 0;
        }
      }
    }
    .no-data {
      height: 100px;
      line-height: 100px;
      text-align: center;
      font-size: 16px;
    }
  }
  .pagination {
    display: flex;
    align-items: center;
    justify-content: right;
    font-size: 13px;
    .page-info {
      margin-right: 15px;
    }
    .page-operation {
      .operation-item {
        padding: 2px 4px;
        border: 1px solid #dcdfe6;
        display: inline-block;
        margin-right: 10px;
        cursor: pointer;
      }
      .prev-btn {
        margin-right: 7px;
      }
    }
  }
}
</style>
