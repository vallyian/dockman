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
    ci: () => (npm("ci", "client"), npm("ci", "server")),
    lint: () => (npm("lint", "client"), npm("lint", "server")),
    build: () => (npm("build", "client"), npm("build", "server")),
    test: () => (npm("test", "client"), npm("test", "server")),
    start: () => (npm("start", "client"), npm("start", "server")),

    ci_github_env: () => console.log(`::set-output name=GITHUB_MAIN::${GITHUB_MAIN}`),

    ci_calc_semver() {
        SEMVER && GITHUB_SHA || term("invalid env vars")
        var result = GITHUB_MAIN === "true" ? SEMVER : `${SEMVER}-${GITHUB_SHA}`;
        console.log(result);
        console.log(`::set-output name=SEMVER::${result}`);
    },

    ci_build: () => {
        fs.rmSync("artifacts", { recursive: true, force: true });
        execSync(`docker buildx build --pull ` +
            `--target="export" ` +
            `--output="type=local,dest=artifacts" ` +
            `.`);
        execSync(`docker buildx build --pull ` +
            `-t="${DOCKER_USERNAME}/${DOCKER_REPO}:local" ` +
            `--build-arg="SEMVER=${SEMVER}" ` +
            `--output="type=docker" ` +
            `.`);
        execSync(`docker image inspect "${DOCKER_USERNAME}/${DOCKER_REPO}:local"`, "ignore");
    },

    ci_check_test_results: () => void 0,

    ci_scan: () => execSync(`docker run --rm --pull="always" ` +
        `-v="/var/run/docker.sock:/var/run/docker.sock" ` +
        `-v="${HOME}/.trivy/cache:/root/.cache" ` +
        `-v="${PWD}:/config" ` +
        `aquasec/trivy image --exit-code=1 ${DOCKER_USERNAME}/${DOCKER_REPO}:local`
    ),

    ci_push: () => execSync(`docker buildx build --pull ` +
        `-t="${DOCKER_USERNAME}/${DOCKER_REPO}:${SEMVER}" ` +
        `-t="${DOCKER_USERNAME}/${DOCKER_REPO}:latest" ` +
        `--build-arg="SEMVER=${SEMVER}" ` +
        `--platform="${PLATFORMS}" ` +
        `--output="type=registry" ` +
        `.`
    ),

    start_docker: () => {
        execTry(`docker stop dockman-local && docker rm dockman-local`, "ignore");
        execSync(`docker run --name dockman-local --rm ` +
            `-v="/var/run/docker.sock:/var/run/docker.sock" ` +
            `-v="/var/lib/docker/volumes:/var/lib/docker/volumes" ` +
            (fs.existsSync(`${HOME}/certs/cert.crt`) ? `-v="${HOME}/certs/cert.crt:/run/secrets/cert.crt" ` : "") + /* optional */
            (fs.existsSync(`${HOME}/certs/cert.key`) ? `-v="${HOME}/certs/cert.key:/run/secrets/cert.key" ` : "") + /* optional */
            `-p="127.0.0.1:55556:55557" ` +
            `vallyian/dockman:local`
        );
    }
});

function npm(script, cwd) { const x = child_process.exec(script, { cwd }); x.stdout.on("data", console.log); x.stderr.on("error", err); };
function execSync(script, stdio = "inherit") { child_process.execSync(script.replace(/\n/gm, ' '), { stdio }); };
function err(log) { console.error(`\x1b[31m${typeof log === "string" ? log : JSON.stringify(log)}\x1b[0m`); };
function term(log) { err(log); process.exit(1) };
function execTry(script, stdio = "inherit") { try { execSync(script, stdio); return true; } catch { return false; } }
