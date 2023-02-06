const child_process = require("node:child_process");
const os = require("node:os");
const fs = require("node:fs");

const DOCKER_USERNAME = process.env["DOCKER_USERNAME"] || "vallyian";
const DOCKER_REPO = process.env["DOCKER_REPO"] || "dockman";
const PLATFORMS = "linux/amd64,linux/arm64/v8";
const GITHUB_MAIN = process.env["GITHUB_MAIN"];
const GITHUB_SHA = process.env["GITHUB_SHA"];
const SEMVER = process.env["SEMVER"];
const HOME = os.homedir();
const PWD = process.cwd();

((fn, arg = process.argv[2]) => fn[arg] ? fn[arg]() : term(`function ${arg} not defined`))({
    "ci": pipe(
        () => exec("npm", ["run", "ci"], { cwd: "client" }),
        () => exec("npm", ["run", "ci"], { cwd: "server" }),
    ),

    "lint": pipe(
        () => exec("npm", ["run", "lint"], { cwd: "client" }),
        () => exec("npm", ["run", "lint"], { cwd: "server" }),
    ),

    "build": pipe(
        () => exec("npm", ["run", "build"], { cwd: "client" }),
        () => exec("npm", ["run", "build"], { cwd: "server" }),
    ),

    "test": pipe(
        () => exec("npm", ["run", "test"], { cwd: "client" }),
        () => exec("npm", ["run", "test"], { cwd: "server" }),
    ),

    "start": pipe(
        () => exec("npm", ["run", "start"], { cwd: "client" }),
        () => exec("npm", ["run", "start"], { cwd: "server" }),
    ),

    "github-env": () => fs.appendFileSync(process.env["GITHUB_OUTPUT"], `GITHUB_MAIN=${GITHUB_MAIN}\n`, "utf-8"),

    "semver": () => {
        SEMVER && GITHUB_SHA || term("invalid env vars")
        const result = GITHUB_MAIN === "true" ? SEMVER : `${SEMVER}-${GITHUB_SHA}`;
        console.log(result);
        fs.appendFileSync(process.env["GITHUB_OUTPUT"], `SEMVER=${result}\n`, "utf-8")
    },

    "build-docker": pipeP(
        () => fs.rmSync("artifacts", { recursive: true, force: true }),
        () => execP("docker", ["buildx", "build", "--pull",
            `--target=export`,
            `--output=type=local,dest=artifacts`,
            "."]),
        () => execP("docker", ["buildx", "build", "--pull",
            `-t=${DOCKER_USERNAME}/${DOCKER_REPO}:local`,
            `--target=runtime`,
            `--build-arg=SEMVER=${SEMVER}`,
            `--output=type=docker`,
            "."]),
        () => execP("docker", ["image", "inspect", `${DOCKER_USERNAME}/${DOCKER_REPO}:local`], { out: false })
    ),

    "check-test-results": () => void 0,

    "scan": () => execP("docker", ["run", "--rm", `--pull=always`,
        `-v=/var/run/docker.sock:/var/run/docker.sock`,
        `-v=${HOME}/.trivy/cache:/root/.cache`,
        `-v=${PWD}:/config`,
        "aquasec/trivy", "image", "--exit-code=1", `${DOCKER_USERNAME}/${DOCKER_REPO}:local`]),

    "push": () => execP("docker", ["buildx", "build", "--pull",
        `-t=${DOCKER_USERNAME}/${DOCKER_REPO}:${SEMVER}`,
        `-t=${DOCKER_USERNAME}/${DOCKER_REPO}:latest`,
        `--target=runtime`,
        `--build-arg=SEMVER=${SEMVER}`,
        `--platform=${PLATFORMS}`,
        `--output=type=registry`,
        `.`]),

    "start-docker": pipeP(
        () => execP("docker", ["stop", "dockman-local"]).catch(() => void 0),
        () => execP("docker", ["rm", "dockman-local"]).catch(() => void 0),
        () => execP("docker", ["run", "--name=dockman-local", "--rm",
            `-v=/var/run/docker.sock:/var/run/docker.sock`,
            `-v=/var/lib/docker/volumes:/var/lib/docker/volumes`,
            (/* optional */ fs.existsSync(`${HOME}/certs/cert.crt`) ? `-v=${HOME}/certs/cert.crt:/run/secrets/cert.crt` : ""),
            (/* optional */ fs.existsSync(`${HOME}/certs/cert.key`) ? `-v=${HOME}/certs/cert.key:/run/secrets/cert.key` : ""),
            `-p=127.0.0.1:55556:55557`,
            "vallyian/dockman:local", "--inspect", "index.cjs"]),
    ),
});

/**
* Spawn a new process without waiting for it to finish
* @param {string} cmd
* @param {string[]} args
* @param {{ out?: boolean, err?: boolean, cwd?: string }} options
* @returns {child_process.ChildProcessWithoutNullStreams} childProcess.ChildProcessWithoutNullStreams
*/
function exec(cmd, args, opts = { out: true, err: true, cwd: process.cwd() }) {
    const actualCmd = cmd === "npm" && os.platform() === "win32" ? "npm.cmd" : cmd;
    const child = child_process.spawn(
        actualCmd,
        (args || []).filter(c => c && !!(String(c).trim())),
        { shell: false, cwd: opts && opts.cwd || process.cwd() }
    );
    if (opts && opts.out !== false) child.stdout.pipe(process.stdout);
    if (opts && opts.err !== false) child.stderr.pipe(process.stderr);
    return child;
}

/**
 * Spawn a new process and waits for it to finish
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ out?: boolean, err?: boolean, cwd?: string }} options
 * @returns {Promise<void>} Promise<void>
 * @throws rejects with the exit code number
 */
function execP(cmd, args, opts = { out: true, err: true, cwd: process.cwd() }) {
    return new Promise((ok, reject) => exec(cmd, args, opts).on("exit", code => code ? reject(code) : ok()));
}

/**
 * Pipe
 * @param {...Function} fns
 * @returns T
 */
function pipe(...fns) { return (...args) => fns.reduce((res, fn) => [fn.call(null, ...res)], args)[0]; }

/**
 * Async pipe
 * @param {...Function} fns
 * @returns Promise<T>
 */
function pipeP(...fns) { return arg => fns.reduce((p, f) => p.then(f), Promise.resolve(arg)); }

/**
 * Logs the error
 * @param {string | object} message
 */
function err(message) { console.error(`\x1b[31m${typeof message === "string" ? message : JSON.stringify(message)}\x1b[0m`); }

/**
 * Logs the error and kills process immediately
 * @param {string | object} message
 * @returns {never} never
 */
function term(message) { err(message); process.exit(1); }
