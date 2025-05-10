export default () => ({
    autoDetect: ['vitest'],

    // // modify `files` automatic configuration settings
    // files: {
    //     override: (filePatterns) => {
    //         // TODO: modify `filePatterns` array as required
    //         return filePatterns;
    //     }
    // },

    // // modify `tests` automatic configuration settings
    // tests: {
    //     override: (testPatterns) => {
    //         // TODO: modify `testPatterns` array as required
    //         return testPatterns;
    //     }
    // },

    // specify non-standard vitest configuration file path
    testFramework: {
        configFile: './vitest.config.ts'
    }
});
