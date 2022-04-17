import minimist from 'minimist';

export interface Arguments {
    test?: string;
    headless: boolean;
}

const ARG_TEST = 'test';
const ARG_HEADLESS = 'headless';

export const getParsedArgs = (): Arguments => {
    const processArgs = minimist(process.argv);
    const test = processArgs[ARG_TEST];
    const headless = processArgs[ARG_HEADLESS] === undefined || processArgs[ARG_HEADLESS] === 'true'; // true by default

    const args = {
        test,
        headless,
    };

    // remember arguments to global variable
    global.parsedArgs = args;
    return args;
};
