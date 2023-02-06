import { execFile } from "node:child_process";

import { globals } from "../../globals";
import { Container, Image, Log, Network, Volume } from "../../../shared/interfaces";

type Part = "image" | "container" | "volume" | "network";
type ContainerAction = "start" | "stop";
type Cmd = "ls" | "inspect" | "logs" | "rm" | ContainerAction;

export function imageLs(id?: string) {
    const getImages = () => ls_exec<Image>("image", id, ["--no-trunc"]);
    const imageMapper = (i: Image) => ({ ...i, CREATED: time(i.CREATED) });
    const mapImages = (is: Image[]) => is.map(imageMapper);
    const imageSorter = (a: Image, b: Image) => sort(
        a.REPOSITORY === "<none>" ? "~" : a.REPOSITORY.toUpperCase(),
        b.REPOSITORY === "<none>" ? "~" : b.REPOSITORY.toUpperCase(),
        a.TAG === "<none>" ? "~" : a.TAG.toUpperCase(),
        b.TAG === "<none>" ? "~" : b.TAG.toUpperCase()
    );
    const sortImages = (is: Image[]) => [...is].sort(imageSorter);

    return getImages()
        .then(mapImages)
        .then(sortImages)
        .catch(asError);
}

export function containerLs() {
    const getContainers = () => ls_exec<Container>("container", undefined, ["-a", "--no-trunc", "--size"]);
    const networkMapper = (c: Container) => {
        c.PORTS = (<string><unknown>c.PORTS).split(",")
            .reduce((ps, p) => {
                const parts = p.trim().split("/")[0].split(":");
                const local = parts[0] === "127.0.0.1";
                const [origin, target] = (parts[1] ?? parts[0]).split("->");
                if (origin && target)
                    ps.push(`${origin}:${target}` + (local ? " (local)" : ""));
                return ps;
            }, new Array<string>());
        c.UP = /^Up /i.test(c.STATUS);
        c.STATUS = time(c.STATUS.replace(/(Up\s+|Exited \(\d+\)\s+)/, ""));
        c.CREATED = time(c.CREATED);
        c.SIZE = c.SIZE.replace("virtual ", "");
        return c;
    };
    const mapContainers = (cs: Container[]) => cs.map(networkMapper);
    const containerSorter = (a: Container, b: Container) => sort(a.NAMES, b.NAMES, a.IMAGE, b.IMAGE);
    const sortContainers = (cs: Container[]) => [...cs].sort(containerSorter);

    return getContainers()
        .then(mapContainers)
        .then(sortContainers)
        .catch(asError);
}

export function volumeLs() {
    const getVolumes = () => ls_exec<Volume>("volume");
    const mapVolumes = (vs: Volume[]) => du_exec(vs);
    const volumeSorter = (a: Volume, b: Volume) => sort(a.NAME, b.NAME, a.DRIVER, b.DRIVER);
    const sortVolumes = (vs: Volume[]) => [...vs].sort(volumeSorter);

    return getVolumes()
        .then(mapVolumes)
        .then(sortVolumes)
        .catch(asError);
}

export function networkLs() {
    const getNetworks = () => ls_exec<Network>("network", undefined, ["--no-trunc"]);
    const networkSorter = (a: Network, b: Network) => sort(a.NAME, b.NAME, a.DRIVER, b.DRIVER);
    const sortNetworks = (ns: Network[]) => [...ns].sort(networkSorter);
    const networkFilterer = (n: Network) => n.NAME !== n.DRIVER && n.DRIVER !== "null";
    const filterNetworks = (ns: Network[]) => ns.filter(networkFilterer);

    return getNetworks()
        .then(sortNetworks)
        .then(filterNetworks)
        .catch(asError);
}

export function container(action: ContainerAction, id: string) {
    const execAction = () => docker_exec("container", action, [id]);
    const validateResult = (r: string[]) => r[0] === id
        ? Promise.resolve(id)
        : Promise.reject(r[0] || "response != id");

    return execAction()
        .then(asArray)
        .then(validateResult)
        .catch(asError);
}

export function logs(id: string): Promise<Error | Log[]> {
    const getLogs = () => docker_exec("container", "logs", [id], ["-t", "--tail", 1000]);
    const reduceLogs = (r: string[]) => {
        const ls = new Array<Log>();
        let err = false;
        r.forEach(l => {
            switch (l) {
                case "<ERROR>": err = true; break;
                case "</ERROR>": err = false; break;
                default: {
                    const entry = <Log>{
                        dt: <unknown>(l.substring(0, 30)),
                        log: l.substring(31, Infinity),
                        err: !!err
                    };
                    if (entry.log.trim()) ls.push(entry);
                    break;
                }
            }
        });
        return ls;
    };
    const logSorter = (a: Log, b: Log) => sort(a.dt, b.dt);
    const sortLogs = (ls: Log[]) => [...ls].sort(logSorter);

    return getLogs()
        .then(asArray)
        .then(reduceLogs)
        .then(sortLogs)
        .catch(asError);
}

export function rm(part: Part, id: string): Promise<Error | string> {
    const flags = new Array<string | number>();
    if (part === "image") flags.push("-f");
    return docker_exec(part, "rm", [id], flags)
        .then(r => asArray(r))
        .then(r => r.filter(l => l === `Deleted: ${id}`) ? id : Promise.reject(r[0] || `response != ${id}`))
        .catch(asError);
}

export function inspect(part: Part, id: string): Promise<Error | Record<string, unknown>> {
    return docker_exec(part, "inspect", [id])
        .then(r => JSON.parse(r)[0])
        .catch(asError);
}

async function ls_exec<T>(part: Part, id?: string, flags?: string[]): Promise<T[]> {
    const std = await docker_exec(part, "ls", id ? [id] : [], flags).then(r => asArray(r));
    const head = std.shift();
    const keys = head.split(/\s{3,}/).reduce(
        (all, key, kx) => {
            all.push({
                key: key.replace(`${part.toUpperCase()} `, ""),
                s: head.indexOf(key)
            });
            if (kx > 0) all[kx - 1].e = all[kx].s - 1;
            return all;
        },
        new Array<{ key: string, s: number, e?: number }>()
    );
    return std.map(line => <T><unknown>keys.reduce(
        (data, k) => { data[k.key] = line.substring(k.s, k.e || Infinity).trim(); return data; },
        <Record<string, string>>{})
    );
}

function time(val: string) {
    return val
        .replace(" ago", "")
        .replace(" seconds", "s")
        .replace(" minutes", "m")
        .replace(" hours", "h")
        .replace(" days", "d")
        .replace(" weeks", "w")
        .replace(" months", "M")
        .replace(" years", "y");
}

function sort(aProp1: unknown, bProp1: unknown, aProp2?: unknown, bProp2?: unknown): -1 | 0 | 1 {
    if (aProp1 < bProp1) return -1;
    if (aProp1 > bProp1) return 1;
    if (aProp2 !== undefined && bProp2 !== undefined) {
        if (aProp2 < bProp2) return -1;
        if (aProp2 > bProp2) return 1;
    }
    return 0;
}

async function du_exec(volumes: Volume[]) {
    const execAction = () => exec(["du", "-hs", ...volumes.map(v => `/var/lib/docker/volumes/${v.NAME}/_data`)]);
    const resultMapper = (s: string) => s.split(/\s+/);
    const mapResult = (ss: string[]) => ss.map(resultMapper);
    const volumeMapper = (ss: string[][]) => (v: Volume) => ({
        ...v,
        SIZE: (ss.find(s => s[1] === `/var/lib/docker/volumes/${v.NAME}/_data`) || [])[0] || "-"
    });
    const addVolumeSize = (ss: string[][]) => volumes.map(volumeMapper(ss));
    const asError = (err: Error) => {
        globals.console.error(err);
        return volumes.map(v => ({ ...v, SIZE: "-" }));
    };

    return execAction()
        .then(asArray)
        .then(mapResult)
        .then(addVolumeSize)
        .catch(asError);
}

function docker_exec(part: Part, cmd: Cmd, id?: string[], flags?: Array<string | number>): Promise<string> {
    return exec(
        ["docker", String(part), String(cmd)]
            .concat(flags ? [...flags].map(f => String(f)) : [])
            .concat(id ? [...id].map(i => String(i)) : [])
    );
}

function exec(command: string[]): Promise<string> {
    globals.console.log("=>", command.join(" "));

    return new Promise((ok, rej) => {
        let log = "";
        const child = execFile(
            command.shift(),
            command,
            { timeout: 60 * 1000, shell: false },
            error => error ? rej(error) : ok(log)
        );
        child.stdout?.on("data", data => log += <string>data);
        child.stderr?.on("data", data => log += "\n<ERROR>\n" + <string>data + "\n</ERROR>\n");
    });
}

function asArray(input: string): string[] {
    return input.split("\n").reduce((all, l) => { if (l.trim()) all.push(l); return all; }, new Array<string>());
}

function asJson(input: unknown) {
    return JSON.stringify(input);
}

function asError(e: unknown) {
    return Error((<Error>e).message || asJson(e));
}
