import * as child_process from "child_process";
import { Container, Image, Network, Volume } from "../../../shared/interfaces"

export async function imageLs(id?: string) {
    let ret = ls<Image>("image", id).map(i => {
        i.CREATED = time(i.CREATED);
        return i;
    });
    ret = ret.sort((a, b) => {
        if (a.REPOSITORY < b.REPOSITORY)
            return -1;
        if (a.REPOSITORY > b.REPOSITORY)
            return 1;
        if (a.TAG < b.TAG)
            return -1;
        if (a.TAG > b.TAG)
            return 1;
        return 0;
    });
    return ret;
}

export async function containerLs(id?: string) {
    let ret = ls<Container>("container", id || "-a").map(c => {
        c.PORTS = (<string><any>c.PORTS).split(",")
            .reduce((ps, p) => {
                p = ((p.match(/0\.0\.0\.0\:(\d{1,}\-\>\d{1,})\/tcp/) || [])[1] || "").replace("->", ":");
                if (p) ps.push(p);
                return ps;
            }, new Array<string>());
        c.UP = /^Up /i.test(c.STATUS);
        c.STATUS = time(c.STATUS.replace(/(Up\s+|Exited \(\d+\)\s+)/, ""));
        c.CREATED = time(c.CREATED);
        return c;
    });
    ret = ret.sort((a, b) => {
        if (a.NAMES < b.NAMES)
            return -1;
        if (a.NAMES > b.NAMES)
            return 1;
        if (a.IMAGE < b.IMAGE)
            return -1;
        if (a.IMAGE > b.IMAGE)
            return 1;
        return 0;
    });
    return ret;
}

export async function containerStart(id: string) {
    let ret = child_process.execSync(`docker container start ${id}`).toString();
    return ret;
}

export async function containerStop(id: string) {
    let ret = child_process.execSync(`docker container stop ${id}`).toString();
    return ret;
}

export async function volumeLs(id?: string) {
    let ret = ls<Volume>("volume", id);
    ret = ret.sort((a, b) => {
        if (a.NAME < b.NAME)
            return -1;
        if (a.NAME > b.NAME)
            return 1;
        if (a.DRIVER < b.DRIVER)
            return -1;
        if (a.DRIVER > b.DRIVER)
            return 1;
        return 0;
    });
    return ret;
}

export async function networkLs(id?: string) {
    let ret = ls<Network>("network", id).filter(n => n.NAME !== n.DRIVER && n.DRIVER !== "null");
    ret = ret.sort((a, b) => {
        if (a.NAME < b.NAME)
            return -1;
        if (a.NAME > b.NAME)
            return 1;
        if (a.DRIVER < b.DRIVER)
            return -1;
        if (a.DRIVER > b.DRIVER)
            return 1;
        return 0;
    });
    return ret;
}

function ls<T>(cmd: "image" | "container" | "volume" | "network", args = "") {
    const std = child_process.execSync(`docker ${cmd} ls ${args} ${cmd !== "volume" ? "--no-trunc" : ""} ${cmd === "container" ? "-s" : ""}`)
        .toString().split("\n").reduce((all, l) => (l = l.trim(), l && all.push(l), all), new Array<string>());
    const head = std.shift()!;
    const keys = head.split(/\s{3,}/).reduce(
        (all, key, kx) => {
            all.push({
                key: key.replace(`${cmd.toUpperCase()} `, ""),
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
        .replace(" minutes", "m")
        .replace(" hours", "h")
        .replace(" days", "d")
        .replace(" weeks", "w")
        .replace(" months", "M")
        .replace(" years", "y");
}

// function inspect(cmd, id) {
//     id = id || ls(cmd).map(i => `'${i.ID || i.NAME}'`).join(" ");
//     const std = JSON.parse(child_process.execSync(`docker ${cmd} inspect ${id}`).toString());
//     console.log(std);
//     return std;
// }
