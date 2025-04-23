/**
 * 模板处理环节
 * @author: wenqd
 */
import { getTemplateJson } from '../api';

// Custom error interface extension
interface CustomError extends Error {
  details?: string;
}

const customThrowError = (message: string, details?: string): never => {
  const error = new Error(message) as CustomError;
  if (details) error.details = details; // 添加自定义属性
  throw error;
};

// Define interfaces for the data structures
interface TemplateItem {
  ccode: string;
  cname: string;
  defaultvalue: any;
  required?: boolean;
  referdata?: any;
}

interface TemplateChild {
  datasourceid: string;
  datasourcecname: string;
  ccodes: TemplateItem[];
}

interface TemplateJson {
  ctemplateid: string;
  datasourceid: string;
  datasourcecname: string;
  ccodes: TemplateItem[];
  children: TemplateChild[];
}

interface FormData {
  ctemplateid: string;
  table: Record<string, any>;
  children: Record<string, any[]>;
}

interface ReferDataItem {
  ccode: string;
  cname: string;
  referdata: any;
}

interface ProcessTemplateResult {
  formdata: FormData;
  tableKey: string;
  referData: ReferDataItem[];
  require_field: string[];
  templateJson: TemplateJson;
  cpageid: string;
  datasourceMapping: Record<string, string>;
  cpagetemplateid: string;
}

interface ProcessTemplateIntent {
  cpageid: string;
  tempid: string;
}

class TemplateProcessor {
  /**
   * 获取模板json
   * @param {string} cpageid 
   * @param {string} cpagetemplateid 
   * @returns {Promise<TemplateJson>}
   */
  async getTemplateJson(cpageid: string, cpagetemplateid: string): Promise<TemplateJson> {
    // 根据id获取模板的逻辑
    const response = await getTemplateJson({ cpageid, cpagetemplateid });
    // Assuming the API returns a data property containing the template JSON
    return response as TemplateJson;
  }

  /**
   * 根据意图进行模板处理
   * @param {ProcessTemplateIntent} intent 
   * @returns {Promise<ProcessTemplateResult>}
   */
  async processTemplate(intent: ProcessTemplateIntent): Promise<ProcessTemplateResult> {
    // 模板处理的逻辑
    // intent中携带cpageid, cpagetemplateid
    const { cpageid, tempid } = intent;

    const templateJson = await this.getTemplateJson(cpageid, tempid);
    if (!templateJson?.ctemplateid) customThrowError('', '当前没有可用模板，请联系管理员');

    const formdata: FormData = {
      ctemplateid: templateJson.ctemplateid,
      table: {},
      children: {}
    };
    
    const datasourceMapping: Record<string, string> = {
      'table': '主表表单',
      'children': '子表明细'
    };

    const require_field: string[] = [];
    const referData: ReferDataItem[] = [];

    // 基本信息
    const tableKey = `${templateJson.datasourceid}&${templateJson.datasourcecname}`;
    formdata.table = {};
    datasourceMapping[tableKey] = templateJson.datasourcecname;

    for (const item of templateJson.ccodes) {
      datasourceMapping[item.ccode] = item.cname;
      formdata.table[item.ccode] = item.defaultvalue;

      if (item.required) {
        require_field.push(item.ccode);
      }

      if (item.referdata) {
        referData.push({
          ccode: item.ccode,
          cname: item.cname,
          referdata: item.referdata
        });
      }
    }

    // 明细信息
    for (const item of templateJson.children) {
      const childrenItemKey = `${item.datasourceid}&${item.datasourcecname}`;
      const childrenItemValue: Record<string, any> = {};
      
      for (const childrenItemValueItem of item.ccodes) {
        childrenItemValue[childrenItemValueItem.ccode] = childrenItemValueItem.defaultvalue;
        
        datasourceMapping[childrenItemValueItem.ccode] = childrenItemValueItem.cname;
        if (childrenItemValueItem.required) {
          require_field.push(childrenItemValueItem.ccode);
        }
      }
      datasourceMapping[childrenItemKey] = item.datasourcecname;
      formdata.children[childrenItemKey] = [childrenItemValue];
    }

    console.log('模板处理结果', formdata, require_field, datasourceMapping);
    return {
      formdata,
      tableKey,
      referData,
      require_field,
      templateJson,
      cpageid: cpageid,
      datasourceMapping,
      cpagetemplateid: tempid
    };
  }

  /**
   * 正反向中英文key互转
   * @param {Object|Array} obj - 要转换的对象或数组
   * @param {Object} keymap - 键映射对象
   * @param {boolean} reverse - 是否进行反向转换
   * @param {string|null} tableKey - 表格键名（用于特殊处理）
   * @returns {Object|Array} 转换后的对象或数组
   */
  translateKeys(obj: any, keymap: any, reverse = false, tableKey: string | null = null): any {
    // 处理 null 或非对象类型
    if (obj == null || typeof obj !== 'object') return obj;

    // 处理数组
    if (Array.isArray(obj)) {
        const translatedArray = obj
            .map(item => this.translateKeys(item, keymap, reverse, tableKey))
            .filter(item => item != null && (typeof item !== 'object' || Object.keys(item).length > 0));
        return translatedArray.length > 0 ? translatedArray : [];
    }

    const translatedObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            // 确定转换后的键名
            const translatedKey = reverse
                ? (this.getKeyByValue(keymap, key) || key)
                : (keymap[key] || key);

            // 反向转换时，跳过不在 keymap 值中的键（除了 'table' 和 'children'）
            if (reverse && !Object.values(keymap).includes(key) && !['table', 'children', 'ctemplateid'].includes(key)) {
                continue;
            }

            // 特殊处理 'table' 键
            if ((translatedKey === 'table' || key === 'table') && tableKey) {
                const tableContent = this.translateKeys(obj[key], keymap, reverse, tableKey);
                if (tableContent && typeof tableContent === 'object') {
                    translatedObj[translatedKey] = tableKey in tableContent
                        ? tableContent
                        : { [tableKey]: tableContent };
                }
            } else {
                // 递归处理嵌套对象或数组
                translatedObj[translatedKey] = this.translateKeys(obj[key], keymap, reverse, tableKey);
            }
        }
    }
    return translatedObj;
  }

  /**
   * 根据值查找对应的键
   * @param {Object} object - 要搜索的对象
   * @param {*} value - 要查找的值
   * @returns {string} 找到的键或原始值
   */
  getKeyByValue(object: any, value: any) {
      return Object.keys(object).find(key => object[key] === value) || value;
  }
}

export default TemplateProcessor;
