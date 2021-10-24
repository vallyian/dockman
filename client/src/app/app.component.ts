import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { routes } from "../../../shared/routes";
import { Image, Volume, Container, Network, Log } from "../../../shared/interfaces";

type View = "images" | "containers" | "volumes" | "networks" | "logs" | "inspect";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    images = new Array<Image>();
    containers = new Array<Container>();
    volumes = new Array<Volume>();
    networks = new Array<Network>();
    selected = new Array<string>();
    previousselected?: string;
    inspectJson?: Object;
    logsArr?: Log[];

    private _view: View = "containers";
    private _previousView?: View;
    get view() { return this._view; }
    set view(view: View) { this._view = view; this.ls(view); }

    constructor(
        private http: HttpClient
    ) {
        this.ls("*");
    }

    select(row: number, event: MouseEvent) {
        const id = (() => {
            switch (this.view) {
                case "images": return this.images[row]?.ID;
                case "containers": return this.containers[row]?.ID;
                case "volumes": return this.volumes[row]?.NAME;
                case "networks": return this.networks[row]?.ID;
                default: return undefined;
            }
        })();
        if (!id) return;
        if (event.shiftKey) {
            document.getSelection()?.empty();
            // const first = this.selected[0];
            // if (!first) {
            //     this.selected.push(id);
            // } else if (first === id) {
            //     this.selected = [];
            // } else {
            //     while (first !== id) {
            //         this.selected.push(id);
            //         row += first < id ? -1 : 1;
            //     }
            // }
        } else if (event.ctrlKey) {
            document.getSelection()?.empty();
            const index = this.selected.indexOf(id);
            index >= 0
                ? this.selected.splice(index, 1)
                : this.selected.push(id);
        } else {
            this.selected = this.selected[0] === id ? [] : [id];
        }
    }

    inspect() {
        if (this.selected.length !== 1) return;
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
        this._previousView = this.view;
        this.previousselected = this.selected[0];
        this.http.get(`${routes.docker.base}${url.replace(":id", encodeURIComponent(this.selected[0]))}`)
            .subscribe(j => this.inspectJson = j);
        this.view = "inspect";
    }

    async wait<T>(cond: () => T | Promise<T>, timeout: number, interval = 100): Promise<T | null | undefined> {
        let result: any;
        do {
            timeout -= interval;
            result = await Promise.resolve().then(() => cond());
        } while ((result === null || result === undefined) && timeout > 0);
        return result;
    }

    logs() {
        if (this.view !== 'containers' || this.selected.length !== 1) return;
        this._previousView = this.view;
        this.previousselected = this.selected[0];
        this.http.get<Log[]>(`${routes.docker.base}${routes.docker.container.logs.replace(":id", encodeURIComponent(this.selected[0]))}`).subscribe(logs => {
            this.view = "logs";
            this.logsArr = logs;
            setTimeout(async () => {
                const elem = await this.wait(() => document.getElementById("logend"), 3000);
                if (elem) setTimeout(() => elem.scrollIntoView({ behavior: "smooth", block: "start" }));
            });
        });
    }

    closeDetails() {
        if (!(['inspect', 'logs'].includes(this.view))) return;
        this.view = this._previousView || "containers";
        if (this.previousselected) this.selected.push(this.previousselected);
        this.inspectJson = undefined;
        this.logsArr = undefined;
    }

    start() {
        if (this.view !== "containers" || this.selected.length === 0)
            return;
        let count = this.selected.length;
        const done = (id: string) => {
            this.selected = this.selected.filter(s => s !== id);
            count--;
            if (!count) this.ls("containers");
        };
        [...this.selected].forEach(id =>
            this.http.get(`${routes.docker.base}${routes.docker.container.start}`.replace(":id", encodeURIComponent(id))).subscribe(
                () => done(id),
                () => done(id)
            )
        );
    }

    stop() {
        if (this.view !== "containers" || this.selected.length === 0)
            return;
        let count = this.selected.length;
        const done = (id: string) => {
            this.selected = this.selected.filter(s => s !== id);
            count--;
            if (!count) this.ls("containers");
        };
        [...this.selected].forEach(id =>
            this.http.get(`${routes.docker.base}${routes.docker.container.stop}`.replace(":id", encodeURIComponent(id))).subscribe(
                () => done(id),
                () => done(id)
            )
        );
    }

    remove() {
        if (this.selected.length === 0)
            return;
        let count = this.selected.length;
        const done = (id: string, view: View) => {
            this.selected = this.selected.filter(s => s !== id);
            count--;
            if (!count) this.ls(view);
        };
        this.selected.forEach(id => {
            switch (this.view) {
                case "images": return this.http.delete(`${routes.docker.base}${routes.docker.image.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected = this.selected.filter(s => s !== id);
                        this.images = this.images.filter(i => i.ID !== id);
                        done(id, "images");
                    },
                    () => done(id, "images")
                );
                case "containers": return this.http.delete(`${routes.docker.base}${routes.docker.container.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected = this.selected.filter(s => s !== id);
                        this.containers = this.containers.filter(c => c.ID !== id);
                        done(id, "containers");
                    },
                    () => done(id, "containers")
                );
                case "volumes": return this.http.delete(`${routes.docker.base}${routes.docker.volume.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected = this.selected.filter(s => s !== id);
                        this.volumes = this.volumes.filter(v => v.NAME !== id);
                        done(id, "volumes");
                    },
                    () => done(id, "volumes")
                );
                case "networks": return this.http.delete(`${routes.docker.base}${routes.docker.network.rm}`.replace(":id", encodeURIComponent(id))).subscribe(
                    () => {
                        this.selected = this.selected.filter(s => s !== id);
                        this.networks = this.networks.filter(n => n.ID !== id);
                        done(id, "networks");
                    },
                    () => done(id, "networks")
                );
                default: return undefined;
            }
        });
    }

    private ls(view: View | "*") {
        this.selected = [];
        if (view === "images" || view === "*")
            this.http.get<Image[]>(`${routes.docker.base}${routes.docker.image.ls}`)
                .subscribe(images => this.images = images);
        if (view === "containers" || view === "*")
            this.http.get<Container[]>(`${routes.docker.base}${routes.docker.container.ls}`)
                .subscribe(containers => this.containers = containers);
        if (view === "volumes" || view === "*")
            this.http.get<Volume[]>(`${routes.docker.base}${routes.docker.volume.ls}`)
                .subscribe(volumes => this.volumes = volumes);
        if (view === "networks" || view === "*")
            this.http.get<Network[]>(`${routes.docker.base}${routes.docker.network.ls}`)
                .subscribe(networks => this.networks = networks);
    }
}
