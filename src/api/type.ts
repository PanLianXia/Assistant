// Message types definition
export enum MessageType {
    WELCOME = 'welcome',             // 欢迎语，不保存
    GUIDE = 'guide',                 // 引导语
    CONFIRMTICKET = 'confirmTicket', // 确认单据卡片
    TICKETLIST = 'ticketList',       // 单据列表
    COMMON = 'common',               // 普通消息
    MARKDOWN = 'markdown',           // Markdown 格式消息
    HIDDEN = 'hidden',               // 隐藏消息
    TIP = 'tip'                      // 提示消息，不保存
}

// Message status
export enum MessageStatus {
    UNSEND = 'UnSend',       // 未发送
    SENDING = 'sending',     // 正在发送
    SUCCESS ='success',      // 发送成功
    FAIL = 'fail',           // 发送失败
    STOPPED = 'stopped',     // 停止发送
}

// Message roles
export enum MessageRole {
    USER = 'user',
    ASSISTANT = 'assistant'
}

// Message interface
export interface Message {
    ccontentid?: string;
    csessionid: string;
    ccontent: string;
    crole: MessageRole | 'user' | 'assistant';
    ctype: MessageType;
    cstatus: MessageStatus;
} 