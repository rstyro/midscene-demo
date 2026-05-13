// browserManager.js
const { chromium } = require('playwright');
const { PlaywrightAgent } = require('@midscene/web/playwright');

class BrowserManager {
    constructor() {
        this.browser = null;       // 浏览器实例
        this.initializing = false; // 初始化锁，防止并发初始化
    }

    async getBrowser() {
        // 如果正在初始化，等待 100ms 后重试
        if (this.initializing) {
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.getBrowser();
        }
        // 如果浏览器未初始化，进行初始化
        if (!this.browser) {
            this.initializing = true;
            try {
                await this.initBrowser();
            } finally {
                this.initializing = false;
            }
        }
        return this.browser;
    }

    async initBrowser() {
        console.log('🚀 启动浏览器...');
        this.browser = await chromium.launch({
            headless: process.env.HEADLESS !== 'false',
            args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        });
        console.log('✅ 浏览器初始化完成');
    }

    /**
     * 为每个请求创建独立的 page 和 agent
     * 创建隔离的浏览器上下文，确保请求之间互不影响
     * @returns {Promise<{page: Object, agent: Object, context: Object}>} 包含 page、agent 和 context 的对象
     */
    async createIsolatedPage() {
        const browser = await this.getBrowser();
        // 创建独立的浏览器上下文（完全隔离 cookies、localStorage 等）
        const context = await browser.newContext();
        const page = await context.newPage();
        const agent = new PlaywrightAgent(page);
        return { page, agent, context };
    }

    /**
     * 清理一个请求的 page 和 context
     */
    async closePageContext(context, page) {
        if (page) await page.close().catch(e => console.warn('关闭 page 失败', e));
        if (context) await context.close().catch(e => console.warn('关闭 context 失败', e));
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('✅ 浏览器已关闭');
        }
    }
}

module.exports = new BrowserManager();