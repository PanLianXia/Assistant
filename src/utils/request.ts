/**
 * 封装Dify应用的流式输出请求
 * @param {string} endpoint - API路径
 * @param {Object} data - 请求数据
 * @param {Object} options - 额外选项
 * @param {Function} options.onMessage - 每次收到数据块时的回调函数
 * @param {Function} options.onError - 发生错误时的回调函数
 * @param {Function} options.onFinish - 流完成时的回调函数
 * @returns {Promise} - 返回一个Promise，可用于取消请求
 */
const streamRequest = (
  endpoint: string, 
  data: Record<string, any> = {}, 
  options: {
    onMessage?: (message: any) => void;
    onError?: (error: Error) => void;
    onFinish?: () => void;
  } = {}
): { cancel: () => void } => {
    const { onMessage, onError, onFinish } = options;
    const token = '538006364510941176#seg#1744937894651#seg#b1ad44f1e81af4d4122c61a691d9e8bd';
    // const token = (typeof plus !== 'undefined' && plus.storage.getItem('token')) ? plus.storage.getItem('token') : localStorage.getItem('token')

    // 确保请求数据包含流模式
    const requestData = {
        ...data,
        inputs: {...data.inputs, token},
        response_mode: "streaming", // 强制设置为流式模式
        user: data.user || "abc-123",
        files: data.files || []
    };
    
    const controller = new AbortController();

    // 创建一个缓冲变量，用于存储未完成的JSON片段
    let incompleteChunk = '';

    // 使用fetch API来处理流式响应
    fetch(`http://172.19.9.231/v1${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer app-EOLfT5ezjojQwF9a01vQI6vh`
        },
        body: JSON.stringify(requestData),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        
            // 获取响应的reader
            const reader = response?.body?.getReader();
            const decoder = new TextDecoder();
        
            // 处理数据流
            function readStream(): any {
                return reader?.read().then(({ done, value }) => {
                    if (done) {
                        // 在流结束时，如果还有未处理的不完整数据，尝试解析一次
                        if (incompleteChunk.trim()) {
                            try {
                                const { messages: finalMessages } = parseStreamData(incompleteChunk, true);
                                finalMessages.forEach(message => {
                                    if (onMessage && message) {
                                        onMessage(message);
                                    }
                                });
                            } catch (error) {
                                console.log('Error processing final chunk:', error);
                            }
                        }
                        onFinish && onFinish();
                        return;
                    }
                
                    try {
                        const chunk = decoder.decode(value, { stream: true });
                        
                        // 将当前块与之前未完成的数据合并
                        const fullChunk = incompleteChunk + chunk;
                        
                        // 处理多个JSON对象可能连在一起的情况
                        const { messages, remainingData } = parseStreamData(fullChunk);
                        
                        // 保存未完成的数据到下一次处理
                        incompleteChunk = remainingData;
                        
                        messages.forEach(message => {
                            if (onMessage && message) {
                                onMessage(message);
                            }
                        });
                    } catch (error: any) {
                        onError && onError(error);
                    }
                
                    // 继续读取下一个数据块
                    return readStream();
                });
            }
        
            // 开始读取数据流
            return readStream();
        })
        .catch(error => {
            onError && onError(error);
        });
    
    // 返回控制器，可用于取消请求
    return {
        cancel: () => controller.abort()
    };
};

/**
 * 解析流式数据，处理可能的多个JSON对象
 * @param {string} chunk - 接收到的数据块
 * @param {boolean} isLastChunk - 是否是最后一个数据块
 * @returns {Object} - 包含解析后的消息数组和剩余未完成数据
 */
const parseStreamData = (chunk: any, isLastChunk = false) => {
    // 处理可能的多JSON对象情况
    const results = [];
    let remainingData = '';
    
    // 按行分割，处理每一行
    const lines = chunk.split('\n');
    
    // 最后一行可能是不完整的，除非是最后一个块
    if (!isLastChunk && lines.length > 0) {
        remainingData = lines.pop() || '';
    }
    
    // 筛选有内容的行
    const filteredLines = lines.filter((line: any) => line.trim());
    
    // 用于存储可能的不完整JSON
    let partialJsonData = '';
    
    for (const line of filteredLines) {
        // 检查是否是ping事件，如果是则跳过处理
        if (line.trim() === 'event: ping') {
            continue;
        }
        
        // 检查是否是data: 前缀
        const dataPrefix = 'data: ';
        
        if (line.startsWith(dataPrefix)) {
            try {
                const jsonStr = line.substring(dataPrefix.length);
                // 检查是否是 [DONE] 标记
                if (jsonStr.trim() === '[DONE]') {
                    continue;
                }
                
                // 尝试解析为JSON
                const data = JSON.parse(jsonStr);
                results.push(data);
                
                // 清空部分JSON数据，因为这个行已经成功解析
                partialJsonData = '';
            } catch (e) {
                // 解析失败，可能是不完整的JSON
                console.log('可能是不完整的JSON，保存到下一次解析:', line);
                partialJsonData += line;
                
                // 尝试将累积的部分JSON与之前的部分合并解析
                if (partialJsonData) {
                    try {
                        const combinedStr = partialJsonData.substring(dataPrefix.length);
                        const data = JSON.parse(combinedStr);
                        results.push(data);
                        // 成功解析后清空
                        partialJsonData = '';
                    } catch (e2) {
                        // 仍然不是完整的JSON，继续等待更多数据
                        console.log('合并后仍然是不完整的JSON:', e2);
                        // partialJsonData 保持不变，等待更多数据合并
                    }
                }
            }
        } else if (line.trim() && !line.startsWith('event:')) {
            // 非data前缀但有内容的行，且不是event开头，可能是之前的部分数据
            partialJsonData += line;
        }
    }
    
    // 如果还有未处理的部分JSON数据，添加到剩余数据中
    if (partialJsonData) {
        remainingData = partialJsonData + remainingData;
    }
    
    return { messages: results, remainingData };
};

// module.exports = {selfRequest, request, init}

export { streamRequest} 
