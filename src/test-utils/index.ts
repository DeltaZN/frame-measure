import {DevToolsAPIWrapper} from "../profile-parser/DevToolsAPIWrapper";
import {setupPage} from "../config/setup";
import {delay} from "./tools";

function describePerf(name: string, describeBody: () => void) {
    describe(name, () => {
        setupPage();
        describeBody();
    });
}

function itPerf(
    name: string,
    testUrl: string,
    delayBeforeTest: number,
    testBody: () => void,
    asserts: () => void,
) {
    describe(name, () => {
        before(name, async() => {
            const report = require(`../../logs/Profile-dropped-frames.json`);
            const devToolsAPIWrapper = new DevToolsAPIWrapper(report);
            console.log(devToolsAPIWrapper);
            global.page = await global.browser.newPage();
            // global.page.setViewport({
            //     width: 1500,
            //     height: 800,
            // });
            await global.page.goto(testUrl);
            await delay(delayBeforeTest);
            await global.page.tracing.start({ path: `./logs/profile_${name}.json` });
        })

        it(name, async() => {
            await testBody();
        })

        after(name, async() => {
            await global.page.tracing.stop();
            const report = require(`../../logs/profile_${name}.json`);
            const devToolsAPIWrapper = new DevToolsAPIWrapper(report);
            const cpuStats = devToolsAPIWrapper.calculateCPUStats();
            const frameStats = devToolsAPIWrapper.calculateFrameStats();
            global.perfMetrics = {
                _devToolsAPI: devToolsAPIWrapper,
                cpuStats,
                frameStats,
            }
            await asserts();
            await global.page.close();
        })
    })
}

export {
    describePerf,
    itPerf,
}
