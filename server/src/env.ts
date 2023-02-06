import assert from "node:assert";
import * as os from "node:os";

import { globals } from "../globals";

export const env = Object.freeze({
    /* from process.env - required => throw if missing */

    /* from process.env - defaults implied */
    NODE_ENV: e("NODE_ENV", "production"),
    CLUSTERS: e("NODE_ENV", "") === "development" ? 1 : os.cpus().length,
    PORT: +e("PORT", "55557"),
    CERT_CRT: e("CERT_CRT", "/run/secrets/cert.crt"),
    CERT_KEY: e("CERT_KEY", "/run/secrets/cert.key")

    /* other */
});

function e(env: string, required: ErrorConstructor | string): string {
    const val = globals.process.env[env];
    switch (true) {
        case typeof val !== "undefined": return String(val).trim();
        case (<ErrorConstructor>required).name === "Error": return assert.fail(`env var ${env} not set`);
        default: return <string>required;
    }
}
