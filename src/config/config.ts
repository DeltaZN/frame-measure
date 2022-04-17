export const mochaConfig = () => ({
    timeout: 30000,
});

export const puppeteerConfig = () => ({
    headless: false,
    slowMo: 25,
    timeout: 10000,
    ignoreHTTPSErrors: true,
    defaultViewport: null,
    args: ['--start-fullscreen'],
    // args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
});
