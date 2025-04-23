import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useConversationStore } from "../stores/conversation";
import { MessageRole, MessageStatus, MessageType, type Message } from "../api/type";
import { addMessage, normalizeFormData } from '../api';
import TemplateProcessor from '../services/templateProcessor';
import { nextTick } from 'vue';

const templateProcessor = new TemplateProcessor();

export const chat = {
    handleChatMessageStream: async (chatContext: any, reqMessage: any, options: any = {}) => {
        // 获取背景信息
        // const { backgroundInfo } = await this.getBackgroundInfo({ chatContext, reqMessage });

        // 创建处理流式响应的回调函数
        const onMessage = (chunk: any) => {
            if (options.onMessage && typeof options.onMessage === 'function') {
                options.onMessage(chunk);
            }
        };

        const onError = (error: any) => {
            console.error('Stream error:', error);
            if (options.onError && typeof options.onError === 'function') {
                options.onError(error);
            }
        };

        const onFinish = async () => {
            if (options.onFinish && typeof options.onFinish === 'function') {
                options.onFinish();
                
                let { content } = chatContext.currentMessageList[chatContext.currentMessageList.length - 1];
                let extractedJson;
                let template;
                let formData;
                let normalizedFields;
                let templateJson;
                let cpageid;
                let cpagetemplateid;
                
                try {
                    // 移除问题分类标记
                    if(content.includes('/sajd@^问题分类：')) {
                        content = content.substring(0, content.indexOf('/sajd@^问题分类：'));
                    }
                    
                    // 尝试多种格式解析
                    let jsonData = null;
                    
                    // 尝试解析Markdown中的JSON
                    const mdJsonMatch = content.match(/```json([\s\S]*?)```/);
                    if (mdJsonMatch) {
                        try {
                            jsonData = JSON.parse(mdJsonMatch[1].trim());
                        } catch (e) {
                            console.log('not ```json```');
                        }
                    }
                    
                    // 如果上面解析失败，尝试直接解析整个内容为JSON
                    if (!jsonData) {
                        try {
                            jsonData = JSON.parse(content);
                        } catch (e) {
                            console.log('not json string');
                        }
                    }
                    
                    // 如果仍然解析失败，可能是纯文本
                    if (!jsonData) {
                        // 对于纯文本，可以创建一个基本结构
                        jsonData = {
                            content,
                            done: false
                        };
                    }
                    
                    // 将解析结果赋值给extractedJson
                    extractedJson = jsonData;
                    
                    // 处理嵌套的result字段
                    if (extractedJson.result) {
                        if (typeof extractedJson.result === 'string') {
                            try {
                                extractedJson.result = JSON.parse(extractedJson.result);
                            } catch (e) {
                                console.log('extractedJson.result is not json string');
                            }
                        }
                    }
                    
                    if(extractedJson.done || extractedJson?.result?.done) {
                        onMessage({ done: true })
                        // TODO根据问题分类处理不同的逻辑操作
                        const queryClassName = '1234';
                        switch(queryClassName) {
                            case 'SQ01填写出差申请单':
                                // Handle ticket confirmation
                                // ({ template } = await this.processTemplate({intent: {cpageid: 'fk_travelapply_bill', tempid: 'fk_travelapply_tem'}}));
                                // formData = this.fieldExtractor.translateKeys(extractedJson.json || extractedJson, template.datasourceMapping, true, template.tableKey);
                                // normalizedFields = await this.normalizeFields.normalize({
                                //     ...formData, 
                                //     cpageid: template.cpageid,
                                //     cpagetemplateid: template.cpagetemplateid,
                                // });
                                // ({ templateJson, cpageid, cpagetemplateid } = template);
                                // options.doneCallback && options.doneCallback({
                                //     messageData: {
                                //         templateJson, 
                                //         cpageid, 
                                //         cpagetemplateid, 
                                //         formData: normalizedFields
                                //     },
                                //     messageType: 'confirmTicket',
                                // });
                                break;
                                
                            case 'BX01差旅报销单相关信息描述':
                                // var childrenInfo = extractedJson.json.children
                                // delete extractedJson.json.children
                                // var baseInfo = extractedJson.json
                                // var detailInfoList = []
                                // for(const key in childrenInfo) {
                                //     const item = {
                                //         title: key,
                                //         showDetail: true,
                                //         content: childrenInfo[key]
                                //     }
                                //     detailInfoList.push(item)
                                // }
                                // options.doneCallback && options.doneCallback({
                                //     messageData: {
                                //         showData: {
                                //             category: '差旅报销单',
                                //             '基本信息': {
                                //                 ...baseInfo
                                //             },
                                //             detailInfoList,
                                //         }
                                //     },
                                //     messageType: 'confirmTicket',
                                // });
                                break;
                            
                            case 'SEARCH01查询用户的单据':
                                // options.doneCallback && options.doneCallback({
                                //     messageData: {
                                //         ticketList: extractedJson.result.vchrs,
                                //         title: reqMessage
                                //     },
                                //     messageType: 'ticketList',
                                // });
                                break;
                                
                            default:
                                console.log('Unknown message type:', extractedJson.messageType);
                        }
                    }
                } catch (error) {
                    console.log('Error processing message:', error);
                }
            }
        };

        // 准备请求数据
        const streamData = {
            inputs: {
                data: JSON.stringify({}),
                ext: options.extensionName
            },
            difyConversationId: '',
            query: reqMessage
        };

        // 发起流式请求
        const result = await api.chatMessageStream(streamData, onMessage, onError, onFinish);
        return result;
    }
}



var abortController: AbortController | null = null;


export const getAIAnswer = (
    data: { inputs: Object, conversation_id?: string, query: string, user?: string, files?: Object }, 
    doneCallback?: ({messageData, messageType}: {messageData: any, messageType: string}) => void
) => {
    const conversationStore = useConversationStore();
    abortController = new AbortController();
    const aiAnswer: Message = {
        ccontentid: new Date().getTime()+'',
        ctype: MessageType.MARKDOWN,
        crole: MessageRole.ASSISTANT,
        ccontent: '',
        cstatus: MessageStatus.SENDING,
        loading: true,
    };
    // 添加到currentMessageList
    conversationStore.addMessage(aiAnswer);
    const requestData = {
        conversation_id: conversationStore.difyConversationId,
        ...data,
        inputs: {...data.inputs, token: '538006364510941176#seg#1745385445130#seg#b32e23005e0009c72f2cab29da01bb4e'},
        response_mode: "streaming", // 强制设置为流式模式
        user: data.user || "abc-123",
        files: data.files || []
    };
    const source = fetchEventSource('http://172.19.9.231/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer app-EOLfT5ezjojQwF9a01vQI6vh`
      },
      body: JSON.stringify(requestData),
      signal: abortController!.signal,
      onopen: (response) => {},
      onmessage: async (msg) => {
        const lastMessage = conversationStore.currentMessageList[conversationStore.currentMessageList.length - 1];
        
        if (!msg.data) {
            console.log('donedone', msg.data);
        //   nextTick(() => {
        //     conversationRef.value?.scrollTo({
        //       top: conversationRef.value.scrollHeight,
        //       behavior: 'smooth',
        //     });
        //   });
          return;
        }
        console.log('msg.data', msg.data);
        const data = JSON.parse(msg.data);

        if(!conversationStore.difyConversationId) {
            conversationStore.difyConversationId = data.conversation_id;
        }

        console.log('data', data, data.event);
        // 判断流式内容是否结束
        if(data.event === 'message_end') {
            // 更新库中最后一条消息
            lastMessage.loading = false;
            lastMessage.cstatus = MessageStatus.SUCCESS;
            const { ctype, ccontent, cstatus } = lastMessage;
            try {
                const message =  await addMessage({
                    ccontentid: '',
                    ctype,
                crole: MessageRole.ASSISTANT,
                ccontent,
                cstatus,
                    csessionid: conversationStore.currentConversation?.id || ''
                })
                lastMessage.ccontentid = message.ccontentid;
                debugger
                nextTick(() => {
                    window.dispatchEvent(new CustomEvent('externalEvent', {detail: {
                        messageId: lastMessage.ccontentid,
                        text: '已深度思考'
                    }}))
                })
            } catch (error) {
                console.log('addMessage error', error);
            }

            // 判断是否包含done标志
            let content = lastMessage.ccontent;
            try {
                // 获取问题分类
                const specialSymbolStart = '/sajd@^问题分类：';
                const specialSymbolEnd = '^@djas/';
                const startIndex = content.indexOf(specialSymbolStart);
                const endIndex = content.indexOf(specialSymbolEnd);
                const queryClassName = content.substring(startIndex + specialSymbolStart.length, endIndex);
                conversationStore.currentQueryClassName = queryClassName;

                // 移除问题分类标记
                if(startIndex !== -1) {
                    content = content.substring(0, startIndex);
                    // 更新库中最后一条消息
                    lastMessage.ccontent = content;
                    addMessage(lastMessage)
                }
                debugger
                
                // 尝试多种格式解析
                let jsonData = null;
                
                // 尝试解析Markdown中的JSON
                const mdJsonMatch = content.match(/```json([\s\S]*?)```/);
                if (mdJsonMatch) {
                    try {
                        jsonData = JSON.parse(mdJsonMatch[1].trim());
                    } catch (e) {
                        console.log('not ```json```');
                    }
                }

                // 判断内容是否被<think>标签包裹
                const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
                if(thinkMatch) {
                    try {
                        jsonData = JSON.parse(thinkMatch[1].trim());
                    } catch (e) {
                        console.log('not think');
                    }
                }
                
                // 如果上面解析失败，尝试直接解析整个内容为JSON
                if (!jsonData) {
                    try {
                        jsonData = JSON.parse(content);
                    } catch (e) {
                        console.log('not json string');
                    }
                }
                
                // 如果仍然解析失败，可能是纯文本
                if (!jsonData) {
                    // 对于纯文本，可以创建一个基本结构
                    jsonData = {
                        content,
                        done: false
                    };
                }
                
                // 将解析结果赋值给extractedJson
                const extractedJson = jsonData;
                
                // 处理嵌套的result字段
                if (extractedJson.result) {
                    if (typeof extractedJson.result === 'string') {
                        try {
                            extractedJson.result = JSON.parse(extractedJson.result);
                        } catch (e) {
                            console.log('extractedJson.result is not json string');
                        }
                    }
                }
                
                if(extractedJson.done || extractedJson?.result?.done) {
                    // 根据问题分类处理不同的逻辑操作
                    const queryClassName = conversationStore.currentQueryClassName;
                    switch(queryClassName) {
                        case 'SQ01填写出差申请单':
                                // Handle ticket confirmation
                                const template = await templateProcessor.processTemplate({cpageid: 'fk_travelapply_bill', tempid: 'fk_travelapply_tem'});
                                const formData = templateProcessor.translateKeys(jsonData.json || jsonData, template.datasourceMapping, true, template.tableKey);
                                const normalizedFields = await normalizeFormData({
                                    ...formData, 
                                    cpageid: template.cpageid,
                                    cpagetemplateid: template.cpagetemplateid,
                                });
                                doneCallback && doneCallback({
                                    messageData: {
                                        templateJson: template.templateJson, 
                                        cpageid: template.cpageid, 
                                        cpagetemplateid: template.cpagetemplateid, 
                                        formData: normalizedFields
                                    },
                                    messageType: MessageType.CONFIRMTICKET,
                                });
                                break;
                                
                        case 'BX01差旅报销单相关信息描述':
                            var childrenInfo = extractedJson.json.children
                            delete extractedJson.json.children
                            var baseInfo = extractedJson.json
                            var detailInfoList = []
                            for(const key in childrenInfo) {
                                const item = {
                                    title: key,
                                    showDetail: true,
                                    content: childrenInfo[key]
                                }
                                detailInfoList.push(item)
                            }
                            doneCallback && doneCallback({
                                messageData: {
                                    showData: {
                                        category: '差旅报销单',
                                        '基本信息': {
                                            ...baseInfo
                                        },
                                        detailInfoList,
                                    }
                                },
                                messageType: MessageType.CONFIRMTICKET,
                            });
                            break;
                        
                        case 'SEARCH01查询用户的单据':
                            doneCallback && doneCallback({
                                messageData: {
                                    ticketList: extractedJson.result.vchrs,
                                    title: data.query
                                },
                                messageType: MessageType.TICKETLIST,
                            });
                            break;
                            
                        default:
                            console.log('Unknown message type:', extractedJson.messageType);
                    }
                }
            } catch (error) {
                console.log('Error processing message:', error);
            }
            return;
        }

        const responseContent = data.answer || '';
        if(lastMessage && responseContent) {
            lastMessage.loading = false;
        }
        if (lastMessage) {
          lastMessage.ccontent += responseContent;
        }
      },
      onerror: (err) => {
        console.log('onerror', err);
        const lastMessage = conversationStore.currentMessageList[conversationStore.currentMessageList.length - 1];
        if (lastMessage) {
          lastMessage.loading = false;
          lastMessage.ccontent = '请求失败';
        }
        throw err;
      },
    });
};
  
export const stop = () => {
    const conversationStore = useConversationStore();
    if (abortController) {
      abortController.abort();
      abortController = null;
      // 更新最后一条消息的状态
      if (conversationStore.currentMessageList.length > 0) {
        const lastMessage = conversationStore.currentMessageList[conversationStore.currentMessageList.length - 1];
        if (lastMessage) {
          lastMessage.loading = false;
          lastMessage.ccontent += '已中止对话';
        }
      }
    }
  };

