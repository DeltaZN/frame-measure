import {describePerf, itPerf} from "../test-utils";
import {delay} from "../test-utils/tools";

// TODO
// 2. try to make perfMetrics global

describePerf('Performance', () => {
    itPerf(
        'Page execution test',
        'http://localhost:3000',
        10000,
        async () => {
            await global.page.evaluate(() => setTimeout(() => {
                let mouseEvent = new MouseEvent('mousedown', { clientX: 50, clientY: 200 });
                window['__CHART_0'].elements.mainCanvas?.parentElement?.dispatchEvent(mouseEvent);

                let i = 0;
                let isLeftDirection = true;
                const maxStepsInSide = 100;
                setInterval(() => {
                    mouseEvent = new MouseEvent('mousemove', {
                        clientX: 1500 + i * 50,
                        clientY: 1500 + i * 20,
                    });
                    document.dispatchEvent(mouseEvent);
                    switch (i) {
                        case 0:
                            isLeftDirection = true;
                            break;
                        case maxStepsInSide:
                            isLeftDirection = false;
                            break;
                        default:
                            break;
                    }
                    i = isLeftDirection ? i + 1 : i - 1;
                })
            }, 500));
            await delay(5000);
        },
        async () => {
            console.log('asserts');
            console.log('longestFrameTime', global.perfMetrics.frameStats.longestFrameTime);
            console.log('avgFPS', global.perfMetrics.frameStats.avgFPS);
            // assert.strictEqual('a', 'b');
        }
    );
});
