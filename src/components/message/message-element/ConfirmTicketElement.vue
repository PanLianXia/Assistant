<template>
  <div class="confirm-ticket-element-wrapper">
    <div class="title">
      <i class="el-icon-tickets title-icon"></i>
      <span>{{ `您创建的${showData.category || ""}` }}</span>
    </div>
    <div class="content">
      <!-- 基本信息 -->
      <div class="base-info">
        <div class="title">基本信息</div>
        <div
          class="base-info-item"
          v-for="(val, key) in showData['基本信息']"
          :key="key"
        >
          {{ `${key}: ${val || ""}` }}
        </div>
      </div>

      <!-- 明细信息 -->
      <div
        class="detail-info"
        v-for="detail of showData.detailInfoList"
        :key="detail.title"
      >
        <div class="title">
          <span>{{ detail.title }}</span>
          <i
            class="el-icon-arrow-up collapse-icon"
            @click="detail.showDetail = !detail.showDetail"
          ></i>
        </div>
        <el-collapse-transition>
          <div v-show="detail.showDetail">
            <div
              class="detail-info-item"
              v-for="(detailItemInfo, index) of detail.content"
              :key="index"
            >
              <div
                class="detail-info-item-content"
                v-for="(val, key) in detailItemInfo"
                :key="key"
              >
                {{ `${key}: ${val || ""}` }}
              </div>
            </div>
          </div>
        </el-collapse-transition>
      </div>
    </div>

    <div class="confirm-btn">
      <button
        class="btn-item"
        :class="{ disabled: confirmBtnDisabled }"
        @click="handleSaveTicket"
      >
        {{ confirmBtnText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useConversationStore } from "../../../stores/conversation";
import { addMessage, saveTicket } from "../../../api/index";
import {
  MessageStatus,
  MessageType,
  MessageRole,
  type Message,
} from "../../../api/type";

// Props declaration
const props = defineProps({
  message: {
    type: Object as () => Message,
    required: true,
  },
});

// Store access
const conversationStore = useConversationStore();

// Reactive state
const confirmBtnDisabled = ref(false);
const confirmBtnText = ref("确认生单");
const showData = ref<any>({});
const ticketLinkListener = ref<((event: Event) => void) | null>(null);

// Computed properties
const messageContent = computed(() => {
  if (typeof props.message.ccontent === "string" && props.message.ccontent) {
    try {
      return JSON.parse(props.message.ccontent);
    } catch (e) {
      console.error("Error parsing message content:", e);
      return props.message.ccontent;
    }
  }
  return props.message.ccontent;
});

const currentMessageList = computed(() => conversationStore.currentMessageList);

// Methods
const generateTicketConfirmData = (templateJson: any, formData: any) => {
  // 确认生单json数据
  let result: any = { 基本信息: {} };
  const tableKey = Object.keys(formData.table)[0];
  const baseInfo = formData.table[tableKey];
  const baseInfoCode = templateJson.ccodes;

  // 标题：单据类别
  result.category = templateJson.ctemplatename;
  // 基本信息
  for (let key in baseInfo) {
    const baseInfoCodeItem = baseInfoCode.find(
      (item: any) => item.ccode === key
    );
    if (baseInfoCodeItem?.iscarddisplay) {
      const finalKey = baseInfoCodeItem?.cname || key;
      result["基本信息"][finalKey] = baseInfo[key];
    }
  }

  // 明细信息
  for (let key in formData.children) {
    let detailItemInfo: any = {};
    const [datasourceid, datasourcecname] = key.split("&");
    detailItemInfo.title = datasourcecname;
    detailItemInfo.showDetail = true;

    const detailItemInfoCode =
      templateJson.children.find(
        (item: any) =>
          item.datasourceid === datasourceid &&
          item.datasourcecname === datasourcecname
      )?.ccodes || [];

    if (!Array.isArray(formData.children[key])) {
      formData.children[key] = [formData.children[key]];
    }

    for (let value of formData.children[key]) {
      let detailItem: any = {};
      for (let detailKey in value) {
        const detailItemInfoCodeItem = detailItemInfoCode.find(
          (item: any) => item.ccode === detailKey
        );
        if (detailItemInfoCodeItem?.iscarddisplay) {
          const finalKey = detailItemInfoCodeItem?.cname || detailKey;
          detailItem[finalKey] = value[detailKey];
        }
      }
      if (Object.keys(detailItem).length > 0) {
        detailItemInfo.content = detailItemInfo.content || [];
        detailItemInfo.content.push(detailItem);
      }
    }
    if (detailItemInfo.content && detailItemInfo.content.length > 0) {
      result.detailInfoList = result.detailInfoList || [];
      result.detailInfoList.push(detailItemInfo);
    }
  }
  return result;
};

const handleSaveTicket = async () => {
  if (confirmBtnDisabled.value) return;

  confirmBtnDisabled.value = true;
  let ticketData = messageContent.value.formData;
  let tipMessage = "生单中...";
  let saveTicketResult = null;

  try {
    saveTicketResult = await saveTicket(ticketData);
    tipMessage =
      saveTicketResult && saveTicketResult.cguid ? "生单成功" : "生单失败";
    console.log(saveTicketResult);
  } catch (error) {
    const returnMsg = error.header?.returnmsg;
    tipMessage = returnMsg || "生单失败";
    const errorMessage: Message = {
      ccontent: tipMessage,
      crole: MessageRole.ASSISTANT,
      ctype: MessageType.COMMON,
      cstatus: MessageStatus.SUCCESS,
      loading: false,
    };
    conversationStore.addMessage(errorMessage);
    addMessage(errorMessage);
  } finally {
    // 更新确认卡片消息内容
    const updateMessage: Message = {
      ...props.message,
      ccontent: JSON.stringify({
        ...messageContent.value,
        saveTicketResult: !!(saveTicketResult && saveTicketResult.cguid),
      }),
    };

    const updateMessageIndex = currentMessageList.value.findIndex(
      (item: any) => item.ccontentid === props.message.ccontentid
    );

    // Update the message in the store
    const updatedMessages = [...currentMessageList.value];
    updatedMessages[updateMessageIndex] = updateMessage;
    conversationStore.clearMessages();
    updatedMessages.forEach((msg) => conversationStore.addMessage(msg));

    addMessage(updateMessage);

    if (saveTicketResult && saveTicketResult.cguid) {
      confirmBtnText.value = "已生单";
      // 单据创建成功后可跳转到单据详情
      const { cpageid, cpagetemplateid } = messageContent.value;

      const tipMessage: Message = {
        ccontentid: new Date().getTime() + "",
        ccontent: `已成功创建${showData.value.category}, 请<a id="ticket-${saveTicketResult.cguid}" style="color: #3181ff;" href="javascript:void(0);" data-cpageid="${cpageid}" data-cpagetemplateid="${cpagetemplateid}" data-cpagetemplatename="${showData.value.category}" data-cguid="${saveTicketResult.cguid}" class="ticket-link">点击</a>查看详情`,
        crole: MessageRole.ASSISTANT,
        ctype: MessageType.TIP,
        cstatus: MessageStatus.SUCCESS,
        loading: false,
      };
      conversationStore.addMessage(tipMessage);
      addMessage(tipMessage);

      // 使用nextTick确保DOM已更新，然后使用重试机制添加事件监听
      nextTick(() => {
        // 在nextTick回调中再添加监听是为了确保消息已添加到DOM中
        if (saveTicketResult && saveTicketResult.cguid) {
          addTicketLinkListener(saveTicketResult.cguid);
        }
      });
    } else {
      confirmBtnDisabled.value = false;
      confirmBtnText.value = "生单失败";
    }
  }
};

// 添加一个新的函数来实现重试机制
const tryAddTicketLinkListener = (
  ticketId: string,
  maxAttempts = 10,
  interval = 50
) => {
  let attempts = 0;

  const tryAttach = () => {
    const link = document.querySelector(`#ticket-${ticketId}`);
    if (link) {
      // 找到元素，添加监听器
      if (ticketLinkListener.value) {
        link.removeEventListener("click", ticketLinkListener.value);
      }
      ticketLinkListener.value = handleTicketClick;
      link.addEventListener("click", ticketLinkListener.value);
      return true; // 成功添加
    } else if (attempts < maxAttempts) {
      // 还未找到元素，且未达到最大尝试次数，继续尝试
      attempts++;
      setTimeout(tryAttach, interval);
      return false; // 尚未添加成功
    }
    return false; // 达到最大尝试次数，放弃
  };

  return tryAttach();
};

// 修改addTicketLinkListener函数使用新的重试机制
const addTicketLinkListener = (ticketId: string) => {
  // 使用重试机制添加事件监听器
  tryAddTicketLinkListener(ticketId);
};

const handleTicketClick = (event: Event) => {
  const target = event.target as HTMLElement;
  const { cpageid, cpagetemplateid, cpagetemplatename, cguid } = target.dataset;
  const url = `/components/apaas-mobile/template/common-vchr?pageid=${cpageid}&templateId=${cpagetemplateid}&cguid=${cguid}&islistdbclick=2`;
  const mainWindow = window?.parent || window;

  if (
    (typeof window.plus !== "undefined" && window.plus) ||
    location.href.includes("isapp=true")
  ) {
    window.uni.navigateTo({ url });
  } else {
    mainWindow.location.href =
      mainWindow.location.pathname +
      `#/page/commonvchr/${cpageid}/${cpagetemplateid}/${cguid}?name=${cpagetemplatename}`;
  }
};

// Lifecycle hooks
onMounted(() => {
  if (messageContent.value.saveTicketResult !== undefined) {
    confirmBtnText.value = messageContent.value.saveTicketResult
      ? "已生单"
      : messageContent.value.saveTicketResult === false
      ? "生单失败"
      : "确认生单";
    confirmBtnDisabled.value = messageContent.value.saveTicketResult;
  }

  if (messageContent.value.showData) {
    showData.value = messageContent.value.showData;
  } else {
    showData.value = generateTicketConfirmData(
      messageContent.value.templateJson,
      messageContent.value.formData
    );
  }

  // Check if this is a saved ticket with a GUID and attach listeners to any existing links
  if (
    messageContent.value.saveTicketResult &&
    messageContent.value.formData?.cguid
  ) {
    nextTick(() => {
      addTicketLinkListener(messageContent.value.formData.cguid);
    });
  }
});

onBeforeUnmount(() => {
  // 组件销毁前移除事件监听器
  const links = document.querySelectorAll(".ticket-link");
  links.forEach((link) => {
    if (ticketLinkListener.value) {
      link.removeEventListener("click", ticketLinkListener.value);
    }
  });
});

// Making window.plus, window.uni and window.$bus available in TypeScript
declare global {
  interface Window {
    plus?: any;
    uni?: any;
    $bus: any;
  }
}
</script>

<style scoped lang="scss">
.confirm-ticket-element-wrapper {
  min-width: 270px;
  padding: 16px 24px;
  border-radius: 8px 8px 8px 8px;
  box-sizing: border-box;
  .title {
    font-size: 16px;
    font-weight: 600;
    color: #282828;
    .title-icon {
      margin-right: 5px;
      font-weight: unset;
    }
  }
  .content {
    line-height: 24px;
    color: #282828;
    .title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-weight: 600;
      .collapse-icon {
        cursor: pointer;
      }
    }
    .detail-info-item {
      margin-top: 5px;
      padding: 5px 10px;
      border-radius: 6px;
      background: #f6f8fd;
    }
  }
  .confirm-btn {
    margin-top: 15px;
    .btn-item {
      display: inline-block;
      width: 100%;
      padding: 7px 15px;
      line-height: 1;
      border-radius: 3px;
      border: 0;
      background-color: #3181ff;
      color: #fff;
      text-align: center;
      box-sizing: border-box;
      cursor: pointer;
      outline: none;
      &:hover {
        background-color: #5a9aff;
      }
      &.disabled {
        cursor: not-allowed;
        background-color: #a0cfff;
      }
    }
  }
}
</style>
