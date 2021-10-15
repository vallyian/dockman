import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { routes } from "../../../shared/routes";
import { Image, Volume, Container, Network } from "../../../shared/interfaces";

type View = "images" | "containers" | "volumes" | "networks";

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
    view: View = "containers";
    selectedRows: number[] = [];

    constructor(
        private http: HttpClient
    ) {
        this.ls("*");
    }

    setView(view: View) {
        this.view = view;
        this.ls(view);
    }

    selectRow(row: number, event: MouseEvent) {
        if (event.shiftKey) {
            document.getSelection()?.empty();
            const first = this.selectedRows[0];
            if (first === undefined) {
                this.selectedRows.push(row);
            } else if (row === first) {
                this.selectedRows = [];
            } else {
                while (row !== first) {
                    this.selectedRows.push(row);
                    if (row > first) {
                        row--;
                    } else {
                        row++;
                    }
                }

            }
        } else if (event.ctrlKey) {
            document.getSelection()?.empty();
            const index = this.selectedRows.indexOf(row);
            index >= 0
                ? this.selectedRows.splice(index, 1)
                : this.selectedRows.push(row);
        } else {
            this.selectedRows = this.selectedRows[0] === row
                ? []
                : [row];
        }
    }

    start() {
        if (this.view !== "containers" || this.selectedRows.length === 0)
            return;
        this.http.post<boolean>(
            `${routes.docker.base}${routes.docker.container.start}`,
            { id: this.selectedRows.map(r => this.containers[r].ID).join(" ") }
        ).subscribe(() => this.ls("containers"));
    }

    stop() {
        if (this.view !== "containers" || this.selectedRows.length === 0)
            return;
        this.http.post<boolean>(
            `${routes.docker.base}${routes.docker.container.stop}`,
            { id: this.selectedRows.map(r => this.containers[r].ID).join(" ") }
        ).subscribe(() => this.ls("containers"));
    }

    remove() {
        if (this.selectedRows.length === 0)
            return;
        if (this.view === "images")
            this.http.get<boolean>(`${routes.docker.base}${routes.docker.image.rm}`)
                .subscribe();
        if (this.view === "containers")
            this.http.get<boolean>(`${routes.docker.base}${routes.docker.container.rm}`)
                .subscribe();
        if (this.view === "volumes")
            this.http.get<boolean>(`${routes.docker.base}${routes.docker.volume.rm}`)
                .subscribe();
        if (this.view === "networks")
            this.http.get<boolean>(`${routes.docker.base}${routes.docker.network.rm}`)
                .subscribe();
    }

    private ls(view: View | "*") {
        this.selectedRows = [];
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
