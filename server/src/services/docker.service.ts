import { execFile } from "child_process";
import { Container, Image, Network, Volume } from "../../../shared/interfaces"

type Part = "image" | "container" | "volume" | "network";
type Cmd = "ls" | "inspect" | "logs" | "rm" | "start" | "stop";

export const ls = {
    image(id?: string): Promise<Error | Image[]> {
        return lsexec<Image>("image", id, ["--no-trunc"])
            .then(i => i.map(i => {
                i.CREATED = time(i.CREATED);
                return i;
            }))
            .then(i => i.sort((a, b) => {
                if (a.REPOSITORY < b.REPOSITORY)
                    return -1;
                if (a.REPOSITORY > b.REPOSITORY)
                    return 1;
                if (a.TAG < b.TAG)
                    return -1;
                if (a.TAG > b.TAG)
                    return 1;
                return 0;
            }))
            .catch(asError);
    },
    container(): Promise<Error | Container[]> {
        return lsexec<Container>("container", undefined, ["-a", "--no-trunc"])
            .then(c => c.map(c => {
                c.PORTS = (<string><any>c.PORTS).split(",")
                    .reduce((ps, p) => {
                        p = ((p.match(/\d+\.\d+\.\d+\.\d+\:(\d+\-\>\d+)\/tcp/) || [])[1] || "").replace("->", ":");
                        if (p) ps.push(p);
                        return ps;
                    }, new Array<string>());
                c.UP = /^Up /i.test(c.STATUS);
                c.STATUS = time(c.STATUS.replace(/(Up\s+|Exited \(\d+\)\s+)/, ""));
                c.CREATED = time(c.CREATED);
                return c;
            }))
            .then(c => c.sort((a, b) => {
                if (a.NAMES < b.NAMES)
                    return -1;
                if (a.NAMES > b.NAMES)
                    return 1;
                if (a.IMAGE < b.IMAGE)
                    return -1;
                if (a.IMAGE > b.IMAGE)
                    return 1;
                return 0;
            }))
            .catch(asError);
    },
    volume(): Promise<Error | Volume[]> {
        return lsexec<Volume>("volume")
            .then(i => i.sort((a, b) => {
                if (a.NAME < b.NAME)
                    return -1;
                if (a.NAME > b.NAME)
                    return 1;
                if (a.DRIVER < b.DRIVER)
                    return -1;
                if (a.DRIVER > b.DRIVER)
                    return 1;
                return 0;
            }))
            .catch(asError);
    },
    network(): Promise<Error | Network[]> {
        return lsexec<Network>("network", undefined, ["--no-trunc"])
            .then(n => n.sort((a, b) => {
                if (a.NAME < b.NAME)
                    return -1;
                if (a.NAME > b.NAME)
                    return 1;
                if (a.DRIVER < b.DRIVER)
                    return -1;
                if (a.DRIVER > b.DRIVER)
                    return 1;
                return 0;
            }))
            .then(n => n.filter(n => n.NAME !== n.DRIVER && n.DRIVER !== "null"))
            .catch(asError);
    },
}

export function container(action: "start" | "stop", id: string): Promise<Error | string> {
    return exec("container", action, [id])
        .then(r => asArray(r))
        .then(r => r[0] === id ? id : Promise.reject(r[0] || "response != id"))
        .catch(asError);
}

export function logs(id: string): Promise<Error | string[]> {
    return exec("container", "logs", [id])
        .then(r => asArray(r))
        .catch(asError);
}

export function rm(part: Part, id: string): Promise<Error | string> {
    return exec(part, "rm", [id])
        .then(r => asArray(r))
        .then(r => r.filter(l => l === `Deleted: ${id}`) ? id : Promise.reject(r[0] || `response != ${id}`))
        .catch(asError);
}

export function inspect(part: Part, id: string): Promise<Error | Object> {
    return exec(part, "inspect", [id])
        .then(r => JSON.parse(r)[0])
        .catch(asError);
}

async function lsexec<T>(part: Part, id?: string, flags?: string[]): Promise<T[]> {
    const std = await exec(part, "ls", id ? [id] : [], flags).then(r => asArray(r));
    const head = std.shift()!;
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
    return std.map(line => <T><any>keys.reduce(
        (data, k) => (data[k.key] = line.substring(k.s, k.e || Infinity).trim(), data),
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

function exec(part: Part, cmd: Cmd, id?: string[], flags?: string[]): Promise<string> {
    const command = ["docker", String(part), String(cmd)]
        .concat(id ? [...id].map(i => String(i)) : [])
        .concat(flags ? [...flags].map(f => String(f)) : []);

    console.log(command);

    return new Promise<string>((ok, rej) => execFile(
        <string>command.shift(),
        command,
        { timeout: 60 * 1000, shell: false },
        (error, stdout, stderr) => {
            if (error) rej(error);
            if (stderr) console.error(stderr);
            ok(stdout);
        }
    ));
}

function asArray(input: string): string[] {
    return input.split("\n").reduce((all, l) => (l = l.trim(), l && all.push(l), all), new Array<string>());
}

function asJson(input: any) {
    return JSON.stringify(input);
}

function asError(e: any) {
    return Error(e.message || asJson(e));
}
