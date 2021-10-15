import * as child_process from "child_process";
import { Container, Image, Network, Volume } from "../../../shared/interfaces"

export async function imageLs(id?: string) {
    let ret = ls<Image>("image", id);
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
    let ret = ls<Container>("container", id);
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
    let ret = ls<Network>("network", id);
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

function ls<T>(cmd: "image" | "container" | "volume" | "network", id = "") {
    return child_process.execSync(`docker ${cmd} ls ${id}`).toString().split("\n").reduce((ret, l, lx) => {
        l = l.trim();
        if (l) {
            const f = l.split(/\s{3,}/);
            if (!lx) {
                ret.keys = f;
            } else {
                const data = f.reduce((val, v, vx) => {
                    val[ret.keys[vx].replace(`${cmd.toUpperCase()} `, "")] = v;
                    return val;
                }, <Record<string, string>>{});
                ret.values.push(<any>data);
            }
        }
        return ret;
    }, {
        keys: new Array<string>(),
        values: new Array<T>()
    }).values;
}

// function inspect(cmd, id) {
//     id = id || ls(cmd).map(i => `'${i.ID || i.NAME}'`).join(" ");
//     const std = JSON.parse(child_process.execSync(`docker ${cmd} inspect ${id}`).toString());
//     console.log(std);
//     return std;
// }
