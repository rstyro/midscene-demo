/**
 * 这个是测试脚本，用于接口/execute/stored 测试
 */
const { searchKeyword = '日历' } = params || {};

const addStep = __addStep || ((name, status, details) => console.log(`[${status}] ${name}`, details || ''));

try {
    __log("全局变量列表:", Object.keys(globalThis));
    addStep('导入依赖', 'success');

    try {
        addStep('访问必应搜索', 'success', { url: 'https://www.bing.com' });
        await page.goto('https://www.bing.com', { waitUntil: 'domcontentloaded' });

        addStep('填写搜索关键词', 'success', { keyword: searchKeyword });
        await page.getByRole('searchbox', { name: /搜索/ }).fill(searchKeyword);

        addStep('提交搜索', 'success');

        await agent.aiAct("点击搜索按钮");
        addStep('等待搜索结果加载', 'success');

        const has = await agent.aiBoolean("页面上是否显示完整的日历信息，包含农历日期和今日宜忌信息");
        if (has) {
            addStep('存在农历信息数据', 'success');
        } else {
            addStep('当前页面不存在农历信息数据', 'fail');
            await agent.aiScroll("尝试页面慢慢向下滚动直到页面包含农历日期和宜忌选项为止");
        }
        await agent.aiAssert('页面包含农历日期信息和宜忌选项');
        addStep('页面出现农历信息', 'success');
        const searchResults = await agent.aiQuery("提取今日是几月几号，今天的第几天，农历日期，还有今日宜忌");
        addStep('提取相关搜索', 'success');

        return {
            success: true,
            message: '搜索执行成功',
            data: {
                keyword: searchKeyword,
                results: searchResults,
            }
        };

    } finally {
        addStep('测试结束', 'success');
    }

} catch (error) {
    addStep('测试失败', 'failed', { error: error.message });
    return {
        success: false,
        message: '搜索执行失败',
        error: error.message
    };
}