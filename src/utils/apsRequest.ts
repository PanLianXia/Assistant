import axios from 'axios'
// import { MessageBox, Message, Notification } from 'element-ui'

function copyContent() {
}
window.copyContent = copyContent()

// create an axios instance
const service = axios.create({
    baseURL: '/APS', // url = base url + request url
    // withCredentials: true, // send cookies when cross-domain requests
    timeout: 100000 // request timeout
})
let isneedLogin = false
function gettargeturl(hoststr: string, pcurl: string) {
    return (pcurl.startsWith('/') ? hoststr + pcurl : hoststr + '/' + pcurl) + '/'
}
// request interceptor
service.interceptors.request.use(
    config => {
        // 打印完整的请求配置
        // console.log('完整的请求配置:', {
        //     url: config.url,
        //     method: config.method,
        //     baseURL: config.baseURL,
        //     headers: config.headers,
        //     params: config.params,
        //     data: config.data,
        //     timeout: config.timeout,
        //     withCredentials: config.withCredentials,
        //     responseType: config.responseType,
        //     maxContentLength: config.maxContentLength,
        //     validateStatus: config.validateStatus,
        //     transformRequest: config.transformRequest,
        //     transformResponse: config.transformResponse
        // });

        if (config?.setTimeout) {
            config.timeout = config.setTimeout
        }
        let base;
        if (typeof plus !== 'undefined') {
            base = plus.storage.getItem('baseUrl');
        } else if (window.location.href.includes('runtimeBaseURL')) {
            const urlParams = new URLSearchParams(window.location.search);
            base = decodeURIComponent(urlParams.get('runtimeBaseURL'));
        } else {
            base = '/APS'
        }
        config.baseURL = `${base}/`;
        // if (store.getters.token) {
            config.headers['token'] = (typeof plus !== 'undefined' && plus.storage.getItem('token')) ? plus.storage.getItem('token') : '538006364510941176#seg#1745385445130#seg#b32e23005e0009c72f2cab29da01bb4e';
        // }
        if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json; charset=UTF-8'
        }
        config.data = config.data || {}
        const currentHref = window.location.href
        const pageAllurl = currentHref.split('#')
        const pageurl = pageAllurl.length > 1 ? pageAllurl[1] : ''
        const productlistStorage = localStorage.getItem('productlist')
        const productlist = (productlistStorage && productlistStorage !== 'undefined') ? JSON.parse(productlistStorage) : []
        const hoststr = window.location.origin
        const productObj = productlist.find(v => v.urllist && v.urllist.find(urlobj => urlobj.urltype === 'pcurl' && currentHref.indexOf(gettargeturl(hoststr, urlobj.url)) === 0))
        const productid = productObj ? productObj.cguid : ''
        if (!config.noModify) {
            // noModify为true时不对data内容进行修改
            config.data = {
                header: {
                    device: '0',
                    version: '1.0.1',
                    url: config?.data?.url || pageurl,
                    productid
                },
                datagram: config.data
            }
            // console.log(Base64.encode(JSON.stringify(config.data.datagram)))
        }
        // 处理核心主程接口动态赋权restful接口问题
        if (config.url.indexOf('aps/core/') !== -1) {
            if (config.url.indexOf('/pageid/') === -1 && !config.notag) {
                config.url = config.url + '/pageid/pageid'
            }
        }
        return config
    },
    error => {
        console.error('请求错误:', error);
        return Promise.reject(error)
    }
)
// response interceptor
service.interceptors.response.use(
    /**
     * If you want to get http information such as headers or status
     * Please return  response => response
     */

    /**
     * Determine the request status by custom code
     * Here is just an example
     * You can also judge the status by HTTP Status Code
     */
    response => {
        // 打印完整的响应信息
        // console.log('完整的响应信息:', {
        //     status: response.status,
        //     statusText: response.statusText,
        //     headers: response.headers,
        //     config: response.config,
        //     data: response.data,
        //     request: response.request
        // });

        const hrefCur = window.location.href
        const isLogin = hrefCur.includes('login') || !hrefCur.split('#')[1]
        const responseData = response.data
        const header = responseData.header
        const config = response.config
        if (responseData.error === 2 && !isLogin && !isneedLogin) {
            isneedLogin = true
            // to re-login
            // MessageBox.confirm(responseData.data || '服务器故障，请稍后再试', '提醒', {
            //     confirmButtonText: '重新登录',
            //     cancelButtonText: '取消',
            //     type: 'warning'
            // }).then(() => {
                
            // })
        } else if (header && header.returncode !== '0000') {
            if (!config.exceptionFilter || config?.exceptionFilter?.enabled === false) {
                // Message({
                //     showClose: true,
                //     dangerouslyUseHTMLString: true,
                //     message: header.returnmsg,
                //     ...config.exceptionFilter
                // })
            }
            if (header.errrormsg) {
                const url = config.url
                const params = config.data
                const error = header.errrormsg.replace(/<|>|'/ig, '"')
                const content = `接口：${url}\n\n 参数：\n${params}\n\n 错误堆栈：\n${error}`
                const name = url.substr(url.lastIndexOf('/') + 1)
                // Notification.error({
                //     title: '来自服务器的错误',
                //     dangerouslyUseHTMLString: true,
                //     customClass: 'NotificationFilter',
                //     message: `
                //     <div style='max-height: 200px;overflow: auto;white-space: normal;word-break: break-all;word-wrap: break-word;padding-right: 3px;position: relative;'>
                //         <div style='position: absolute; right: 10px; top: 0'>
                //             <a
                //                 style='padding: 0 5px' οnClick='copyContent()'
                //                 data-clipboard-text='${error}'
                //                 class='el-button--text copy-error'>复制</a>
                //             /
                //             <a
                //                 class='el-button--text'
                //                 style='padding: 0 5px'
                //                 download='${name + new Date().getDate() + '日' + new Date().getHours() + '时' + new Date().getSeconds() + '秒'}.txt'
                //                 href='data:text/plain;charset=utf-8,${encodeURIComponent(content)}'>下载</a>
                //             错误信息
                //         </div>

                //         <div
                //             class='copy-error'
                //             data-clipboard-text='${url}'
                //             style='margin-bottom: 10px; color: red; font-weight: bold; cursor: pointer'
                //             οnClick='copyContent()'
                //         >
                //             <h4>接口：</h4>${url}
                //         </div>
                //         <div
                //             class='copy-error'
                //             style='margin-bottom: 10px; cursor: pointer'
                //         >
                //             <h4>参数：</h4><pre style="white-space: normal; font-family: Arial, 'Microsoft Yahei', sans-serif">${params}</pre>
                //         </div>
                //         <div
                //          class='copy-error'
                //          data-clipboard-text='${error}'
                //          style='cursor: pointer'
                //         ><h4>错误堆栈：</h4><pre style="white-space: normal; font-family: Arial, 'Microsoft Yahei', sans-serif">${error}</pre></div>
                //     </div>
                //     `,
                //     duration: 0,
                //     position: 'bottom-right'
                // })
            }
            return Promise.reject(responseData)
        } else {
            if (!config.responseFilter || config.responseFilter?.enabled) {
                if (typeof config.responseFilter?.customFilter === 'function') {
                    return config.responseFilter.customFilter.call(this, responseData)
                } else {
                    return responseData.datagram
                }
            } else {
                return responseData
            }
        }
        if (response.status === 555) { // 灰度更新时的状态码
            location.reload()
        }
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
        
        console.log('接口报错' + error)
        Notification.error({
            title: '来自服务器的错误',
            dangerouslyUseHTMLString: true,
            customClass: 'NotificationFilter',
            message: '接口：' + error?.config?.url || '' + '，\n异常：' + error.message,
            duration: 0,
            position: 'bottom-right'
        })
        return Promise.reject(error)
    }
)

export default service
