import { SpecReporter, StacktraceOption } from "jasmine-spec-reporter";
const { JUnitXmlReporter } = require("jasmine-reporters");

const jenv = jasmine.getEnv();
jenv.clearReporters();
jenv.addReporter(
    new SpecReporter({
        spec: { displayStacktrace: StacktraceOption.PRETTY },
    })
);
jenv.addReporter(
    new JUnitXmlReporter({
        savePath: "./test-results",
        consolidateAll: false,
        filePrefix: require("./package.json").name.replace(/[^a-zA-Z0-9]/g, "") + "_" + new Date().toISOString().replace(/[^0-9]/g, "_")
    })
);

module.exports = <jasmine.JasmineConfig>{
    spec_files: ["src/**/*.spec.ts"],
    stopSpecOnExpectationFailure: true,
    random: true,
};
