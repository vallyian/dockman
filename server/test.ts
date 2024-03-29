/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-var-requires */

const Jasmine = require("jasmine");
const { JUnitXmlReporter } = require("jasmine-reporters");
const { SpecReporter, StacktraceOption } = require("jasmine-spec-reporter");

const { name } = require("./package.json");

const runner = new Jasmine();

runner.loadConfig({
    spec_files: ["src/**/*.spec.ts"],
    stopSpecOnExpectationFailure: true,
    random: true,
});

runner.clearReporters();
runner.addReporter(
    new SpecReporter({
        spec: { displayStacktrace: StacktraceOption.PRETTY },
    })
);
runner.addReporter(
    new JUnitXmlReporter({
        savePath: "./test-results",
        consolidateAll: false,
        filePrefix: name.replace(/[^a-zA-Z0-9]/g, "") + "_" + new Date().toISOString().replace(/\D/g, "_")
    })
);

runner.execute().catch((e: Error) => {
    console.error("test run failed:", e);
    process.exit(1);
});
