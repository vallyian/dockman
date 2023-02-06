import { AfterViewInit, Component, HostListener, ViewChildren } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { routes } from "../../../shared/routes";
import { Image, Volume, Container, Network, Log } from "../../../shared/interfaces";

type View = "images" | "containers" | "volumes" | "networks" | "logs" | "inspect";

@Component({
    selector: "app-root",
    templateUrl: "./app.component.html",
    styleUrls: ["./app.component.css"]
})
export class AppComponent implements AfterViewInit {
    readonly data = {
        images: new Array<Image>(),
        containers: new Array<Container>(),
        volumes: new Array<Volume>(),
        networks: new Array<Network>(),
        inspect: <Object | undefined>undefined,
        logs: <Log[] | undefined>undefined
    };
    readonly selected = {
        items: new Array<string>(),
        previous: <string | null>null
    };
    readonly filter = {
        value: "",
        elem: <HTMLInputElement | null>null
    };

    get view() { return this.viewData.current; }
    set view(view: View) {
        this.viewData.current = view;
        this.ls(view);
        this.filter.elem?.focus();
    }

    @ViewChildren("filterField") filterField: any;

    private readonly viewData = {
        current: <View>"containers",
        previous: <View | undefined>undefined
    };
    private readonly _data = {
        images: new Array<Image>(),
        containers: new Array<Container>(),
        volumes: new Array<Volume>(),
        networks: new Array<Network>()
    };

    constructor(
        private http: HttpClient
    ) {
        this.ls("*");
    }

    ngAfterViewInit() {
        this.filter.elem = document.getElementById("filter") as HTMLInputElement;
    }

    @HostListener("document:visibilitychange")
    refresh() {
        if (document.hidden || !this.viewData.current) return;
        this.ls(this.viewData.current);
    }

    select(row: number, event: MouseEvent) {
        const id = this.getId(row);
        if (!id) return;
        if (event.shiftKey) {
            this.selectShift(id, row);
        } else if (event.ctrlKey) {
            this.selectCtrl(id);
        } else {
            this.selected.items = this.selected.items[0] === id ? [] : [id];
        }
    }

    unselect(event: MouseEvent) {
        if (!event || !event.target || !(<HTMLElement>event.target).classList.contains("content")) return;
        this.selected.items = [];
    }

    inspect() {
        if (this.selected.items.length !== 1) return;
        const url = (() => {
            switch (this.view) {
                case "images": return routes.docker.image.inspect;
                case "containers": return routes.docker.container.inspect;
                case "volumes": return routes.docker.volume.inspect;
                case "networks": return routes.docker.network.inspect;
                default: return undefined;
            }
        })();
        if (!url) return;
        this.viewData.previous = this.view;
        this.selected.previous = this.selected.items[0];
        this.http.get(`${routes.docker.base}${url.replace(":id", encodeURIComponent(this.selected.items[0]))}`)
            .subscribe(j => this.data.inspect = j);
        this.view = "inspect";
    }

    logs() {
        if (this.view !== "containers" || this.selected.items.length !== 1) return;
        this.viewData.previous = this.view;
        this.selected.previous = this.selected.items[0];
        this.http.get<Log[]>(`${routes.docker.base}${routes.docker.container.logs.replace(":id", encodeURIComponent(this.selected.items[0]))}`).subscribe(logs => {
            this.view = "logs";
            this.data.logs = logs;
            setTimeout(async () => {
                const elem = await this.wait(() => document.getElementById("logend"), 3000);
                if (elem) setTimeout(() => elem.scrollIntoView({ behavior: "smooth", block: "start" }));
            });
        });
    }

    closeDetails() {
        if (!(["inspect", "logs"].includes(this.view))) return;
        this.view = this.viewData.previous || "containers";
        if (this.selected.previous) this.selected.items.push(this.selected.previous);
        this.data.inspect = undefined;
        this.data.logs = undefined;
    }

    start() { this.startStop(routes.docker.container.start); }
    stop() { this.startStop(routes.docker.container.stop); }

    remove() {
        if (this.selected.items.length === 0)
            return;
        let count = this.selected.items.length;
        const done = (id: string, view: View) => {
            this.selected.items = this.selected.items.filter(s => s !== id);
            count--;
            if (!count) this.ls(view);
        };
        this.selected.items.forEach(id => {
            switch (this.view) {
                case "images": return this.http.delete(`${routes.docker.base}${routes.docker.image.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected.items = this.selected.items.filter(s => s !== id);
                        this._data.images = this._data.images.filter(i => i.ID !== id);
                        done(id, "images");
                    },
                    () => done(id, "images")
                );
                case "containers": return this.http.delete(`${routes.docker.base}${routes.docker.container.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected.items = this.selected.items.filter(s => s !== id);
                        this._data.containers = this._data.containers.filter(c => c.ID !== id);
                        done(id, "containers");
                    },
                    () => done(id, "containers")
                );
                case "volumes": return this.http.delete(`${routes.docker.base}${routes.docker.volume.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected.items = this.selected.items.filter(s => s !== id);
                        this._data.volumes = this._data.volumes.filter(v => v.NAME !== id);
                        done(id, "volumes");
                    },
                    () => done(id, "volumes")
                );
                case "networks": return this.http.delete(`${routes.docker.base}${routes.docker.network.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected.items = this.selected.items.filter(s => s !== id);
                        this._data.networks = this._data.networks.filter(n => n.ID !== id);
                        done(id, "networks");
                    },
                    () => done(id, "networks")
                );
                default: return undefined;
            }
        });
    }

    updateFilter() {
        if (this.view === "images")
            this.data.images = <Image[]>this.lsFilter(this._data.images);
        if (this.view === "containers")
            this.data.containers = <Container[]>this.lsFilter(this._data.containers);
        if (this.view === "volumes")
            this.data.volumes = <Volume[]>this.lsFilter(this._data.volumes);
        if (this.view === "networks")
            this.data.networks = <Network[]>this.lsFilter(this._data.networks);
    }

    link(port: string): string {
        return (port.startsWith("443:") ? "https:" : "") + "//" +
            window.location.hostname + ":" + port.split(":")[0];
    }

    private ls(view: View | "*") {
        this.selected.items = [];
        if (view === "images" || view === "*")
            this.http.get<Image[]>(`${routes.docker.base}${routes.docker.image.ls}`)
                .subscribe(images => { this._data.images = images; this.data.images = <Image[]>this.lsFilter(images); });
        if (view === "containers" || view === "*")
            this.http.get<Container[]>(`${routes.docker.base}${routes.docker.container.ls}`)
                .subscribe(containers => { this._data.containers = containers; this.data.containers = <Container[]>this.lsFilter(containers); });
        if (view === "volumes" || view === "*")
            this.http.get<Volume[]>(`${routes.docker.base}${routes.docker.volume.ls}`)
                .subscribe(volumes => { this._data.volumes = volumes; this.data.volumes = <Volume[]>this.lsFilter(volumes); });
        if (view === "networks" || view === "*")
            this.http.get<Network[]>(`${routes.docker.base}${routes.docker.network.ls}`)
                .subscribe(networks => { this._data.networks = networks; this.data.networks = <Network[]>this.lsFilter(networks); });
    }

    private lsFilter(items: Array<Image | Container | Volume | Network>) {
        return !this.filter.value
            ? items
            : items.filter(i => Object.values(i).find(v => String(v).includes(this.filter.value)));
    }

    private async wait<T>(cond: () => T | Promise<T>, timeout: number, interval = 100): Promise<T | null | undefined> {
        let result: any;
        do {
            timeout -= interval;
            result = await Promise.resolve().then(() => cond());
        } while ((result === null || result === undefined) && timeout > 0);
        return result;
    }

    private getId(ix: number) {
        switch (this.view) {
            case "images": return this.data.images[ix]?.ID;
            case "containers": return this.data.containers[ix]?.ID;
            case "volumes": return this.data.volumes[ix]?.NAME;
            case "networks": return this.data.networks[ix]?.ID;
            default: return undefined;
        }
    }

    private selectShift(id: string, row: number) {
        document.getSelection()?.empty();
        const first = this.selected.items[0];
        if (!first) {
            this.selected.items.push(id);
        } else if (first === id) {
            this.selected.items = [];
        } else {
            const getIx = (id: string) => {
                switch (this.view) {
                    case "images": return this.data.images.findIndex(i => i.ID === id);
                    case "containers": return this.data.containers.findIndex(c => c.ID === id);
                    case "volumes": return this.data.volumes.findIndex(v => v.NAME === id);
                    case "networks": return this.data.networks.findIndex(n => n.ID === id);
                    default: return undefined;
                }
            };
            let lastRow = getIx(this.selected.items[this.selected.items.length - 1])!;
            while (row !== lastRow) {
                lastRow += row < lastRow ? -1 : 1;
                const newId = this.getId(lastRow);
                if (!newId || this.selected.items.includes(newId)) continue;
                this.selected.items.push(newId);
            }
        }
    }

    private selectCtrl(id: string) {
        document.getSelection()?.empty();
        const index = this.selected.items.indexOf(id);
        index >= 0
            ? this.selected.items.splice(index, 1)
            : this.selected.items.push(id);
    }

    private startStop(action: string) {
        if (this.view !== "containers" || this.selected.items.length === 0)
            return;
        let count = this.selected.items.length;
        const done = (id: string) => {
            this.selected.items = this.selected.items.filter(s => s !== id);
            count--;
            if (!count) this.ls("containers");
        };
        [...this.selected.items].forEach(id =>
            this.http.get(`${routes.docker.base}${action}`.replace(":id", encodeURIComponent(id))).subscribe(
                () => done(id),
                () => done(id)
            )
        );
    }
}
