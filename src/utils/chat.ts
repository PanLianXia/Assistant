import { api } from "./api";

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

