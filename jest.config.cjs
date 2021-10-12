module.exports = {
    // testMatch: [],
    collectCoverageFrom: [
        'src/**/*.{mjs,js,jsx,ts,tsx}',
        '!**/*.d.ts'
    ],
    setupFiles: [
        '<rootDir>/test/bootstrap.cjs'
    ],
    testURL: 'http://localhost:8080',
    moduleNameMapper: {
        '^(.*)\.js$': '$1',
    },
};


