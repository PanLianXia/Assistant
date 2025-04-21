<template>
  <div class="common-card">
    <div class="card-header">
      <div class="card-title">{{ displayTitle }}</div>
      <div
        v-if="ticket.cstatus_name"
        class="card-status"
        :style="statusColorStyle"
      >
        {{ ticket.cstatus_name }}
      </div>
    </div>
    <div class="card-body">
      <div
        class="card-item"
        v-for="(field, index) in displayFields"
        :key="index"
        @click="handleFieldClick(field)"
      >
        <div class="item-label">{{ field.label }}:</div>
        <div class="item-value" :title="ticket[field.key] || '-'">
          {{ ticket[field.key] || "-" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface TicketField {
  key: string;
  label: string;
}

interface TicketItem {
  ctemplateid_name?: string;
  cstatus_name?: string;
  ccode?: string;
  ccreatetime?: string;
  cbustype_name?: string;
  cdeptid_name?: string;
  [key: string]: any;
}

// Define fixed display fields for the card
const DEFAULT_DISPLAY_FIELDS: TicketField[] = [
  { key: "ccode", label: "单据编号" },
  { key: "ccreatetime", label: "创建时间" },
  { key: "cbustype_name", label: "单据类型" },
  { key: "cdeptid_name", label: "部门" },
];

// Define component props with TypeScript
const props = defineProps<{
  ticket: TicketItem;
  displayFields?: TicketField[];
  statusColorMap?: Record<string, string>;
  titleField?: string;
}>();

// Define component emits
const emit = defineEmits<{
  (e: "field-click", field: TicketField, value: any): void;
}>();

// Computed properties
const displayFields = computed<TicketField[]>(() => {
  return props.displayFields || DEFAULT_DISPLAY_FIELDS;
});

// Get the title to display
const displayTitle = computed(() => {
  if (props.titleField && props.ticket[props.titleField]) {
    return props.ticket[props.titleField];
  }
  return props.ticket.ctemplateid_name || "单据";
});

// Get status color style
const statusColorStyle = computed(() => {
  if (!props.ticket.cstatus_name || !props.statusColorMap) {
    return {};
  }

  const color = props.statusColorMap[props.ticket.cstatus_name] || "#409eff";
  return {
    backgroundColor: `${color}20`,
    color: color,
  };
});

// Handle field click
const handleFieldClick = (field: TicketField) => {
  emit("field-click", field, props.ticket[field.key]);
};
</script>

<style scoped lang="scss">
.common-card {
  width: 100%;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #ebeef5;

    .card-title {
      font-weight: 600;
      font-size: 14px;
    }

    .card-status {
      font-size: 12px;
      color: #409eff;
      padding: 2px 6px;
      border-radius: 10px;
      background-color: #ecf5ff;
    }
  }

  .card-body {
    padding: 10px;

    .card-item {
      display: flex;
      margin-bottom: 6px;
      font-size: 13px;
      cursor: pointer;
      padding: 2px 0;
      transition: background-color 0.2s;
      border-radius: 2px;

      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .item-label {
        color: #909399;
        width: 70px;
        flex-shrink: 0;
      }

      .item-value {
        flex: 1;
        color: #303133;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
