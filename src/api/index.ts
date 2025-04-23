import type { Message } from './type';
import { request } from '../utils/request';

/**
 * 新增或者修改消息
 * @param message 
 * @returns 
 */
export const addMessage = async (message: Message): Promise<any> => {
    return request({
        url: 'aps/chat/conversations/addchatrecords',
        method: 'POST',
        data: message
    })
};

/**
 * 获取模板json
 * @param {*} param0 
 * @returns 
 */
export const getTemplateJson = async (params: { cpageid: string, cpagetemplateid: string }): Promise<any> => {
    return request({
        url: '/aps/im/largemodelimport/getmodeljson',
        method: 'POST',
        data: params
    })
}

/**
 * 单据数据非标转标
 * @param {*} formdata 
 * @returns 
 */
export const normalizeFormData = async (formdata: any) => {
    return request({
        url: 'aps/im/largemodelimport/modelreferdata',
        method: 'POST',
        data: formdata
    })
}

/**
 * 获取背景信息
 */
export const getBackgroundInfo = () => {
    return request({
        url: 'aps/im/largemodelimport/getbackground',
        method: 'POST',
    })
}

/**
 * 确认生单（保存单据）
 * @param {*} data 
 * @returns 
 */
export const saveTicket = async (formdata: any): Promise<any> => {
    return request({
        url: 'aps/im/largemodelimport/import',
        method: 'POST',
        data: formdata
    })
}

/**
 * 查询单据列表
 * @param {*} data 
 * @returns 
 */
export const queryTicketList = async (data: any): Promise<any> => {
    return request({
        url: 'aps/im/largemodelimport/cardlist',
        method: 'POST',
        data
    })
}
