import { getBackgroundInfo } from "../api";

class BackgroundService {
    async getBackground(): Promise<string> {
        const backgroundInfoObj = await getBackgroundInfo();
        let backgroundInfoStr = Object.entries(backgroundInfoObj).map(([key, value]) => `当前用户${key}: ${value}`).join(';')
        let currentDate = new Date().toISOString().split('T')[0]; // 获取 YYYY-MM-DD 格式的日期
        backgroundInfoStr += `; 当前时间：${currentDate}`;
        try {
            if (typeof plus !== 'undefined') {
                backgroundInfoStr += `; 当前用户：${JSON.parse(plus.storage.getItem('userInformation')).userName}`;
            } else {
                backgroundInfoStr += `; 当前用户：${JSON.parse(localStorage.getItem('userInformation') || '{}').userName}`;
            }
        } catch (error) {
            console.log('获取背景信息 获取用户信息失败', error);
        }
        return backgroundInfoStr;
    }
}

export default BackgroundService;