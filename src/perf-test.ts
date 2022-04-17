import glob from 'glob';
import path from 'path';
import Mocha from 'mocha';

import {mochaConfig} from './config/config';
import {mkdir} from "fs";
import {Page} from "puppeteer";
import {Arguments, getParsedArgs} from "./util/args-parser";
import {PerfMetrics} from "./profile-parser/metrics.model";

declare global {
    namespace NodeJS {
        interface Global {
            browser: any;
            page: Page;
            parsedArgs: Arguments;
            perfMetrics: PerfMetrics;
        }
    }
}

getParsedArgs()

const mochaInstance = new Mocha(mochaConfig());

const runTests = () => {
    mkdir('reports', () => {
    });
    mochaInstance.run(async failures => {
        // exit with non-zero status if there were failures
        process.exitCode = failures ? -1 : 0;
    });
};

// run single test if specified
const test = '';
if (test) {
    console.log('Running single test: ' + test);
    mochaInstance.addFile(test);
    runTests();
} else {
    // check if warm-up required
    const warmUp = '';
    const warmUpFile = 'tests/warm-up.spec.js';
    if (warmUp) {
        console.log('Warm-up test: ' + warmUpFile);
        mochaInstance.addFile(path.join(warmUpFile));
    }
    // Traverses all test-related files in 'tests' folder.
    // First adds common tests folder, then vendor-specific folder tests.
    glob('src/**/*.spec.ts', {}, async (er, files) => {
        // add found test files to mocha context
        files.forEach(file => {
            console.log('Test found: ' + file);
            mochaInstance.addFile(path.join(file));
        });
        runTests();
    });
}
