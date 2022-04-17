import puppeteer from 'puppeteer';
import {puppeteerConfig} from "./config";

export const setupPage = () => {
    before(async() => {
        global.browser = await puppeteer.launch(puppeteerConfig());
    })

    after(async() => {
        await global.browser.close();
    })
};
