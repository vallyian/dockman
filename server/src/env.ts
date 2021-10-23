import * as os from "os";

export default Object.freeze({
    /* from process.env - required => throw if missing */

    /* from process.env - defaults implied */
    NODE_ENV: e("NODE_ENV", "production"),
    CLUSTERS: e("NODE_ENV", "") === "development" ? 1 : os.cpus().length,
    PORT: +e("PORT", "5555"),

    /* other */
});

function e(env: string, required: ErrorConstructor | string): string {
    const val = process.env[env];
    return typeof val !== "undefined"
        ? String(val).trim()
        : (<ErrorConstructor>required).name === "Error"
            ? (() => { throw Error(`env var ${env} not set`); })()
            : <string>required;
}
