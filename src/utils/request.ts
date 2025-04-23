// 引入axios
import axios from 'axios';

// 创建 axios 实例
const selfRequest = axios.create({
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 设置默认实例
let request = selfRequest;

// 为默认实例设置请求拦截器
selfRequest.interceptors.request.use(
    config => {
        // 确保 headers 存在
        config.headers = {
            ...selfRequest.defaults.headers,
            ...config.headers
        } as any;

        // 打印完整的请求配置
        console.log('完整的请求配置:', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL,
            headers: config.headers,
            params: config.params,
            data: config.data,
            timeout: config.timeout,
            withCredentials: config.withCredentials,
            responseType: config.responseType,
            maxContentLength: config.maxContentLength,
            validateStatus: config.validateStatus,
            transformRequest: config.transformRequest,
            transformResponse: config.transformResponse
        });

        // 确保请求数据存在
        config.data = config.data || {};
        return config;
    },
    error => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 为默认实例设置响应拦截器
selfRequest.interceptors.response.use(
    response => {
        // 打印完整的响应信息
        console.log('完整的响应信息:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: response.config,
            data: response.data,
            request: response.request
        });
        return response;
    },
    error => {
        // 打印完整的错误信息
        console.error('响应错误:', {
            message: error.message,
            config: error.config,
            response: error.response,
            request: error.request,
            stack: error.stack
        });
        return Promise.reject(error);
    }
);

const init = (config: any) => {
    request = config;
};

export { selfRequest, request, init} 