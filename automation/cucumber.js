module.exports = {
    default: {
        requireModule: ['ts-node/register'],
        require: ['tests/steps/**/*.ts', 'tests/support/**/*.ts'],
        format: ['progress', 'html:cucumber-report.html', 'json:cucumber-report.json'],
        formatOptions: {
            snippetInterface: 'async-await'
        },
        publishQuiet: true
    }
}; 