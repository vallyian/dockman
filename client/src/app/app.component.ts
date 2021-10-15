import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { routes } from "../../../shared/routes";
import { Image, Volume, Container, Network } from "../../../shared/interfaces";
import { } from '@angular/compiler/src/i18n/i18n_ast';

type View = "images" | "containers" | "volumes" | "networks";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    images?: Image[];
    containers?: Container[];
    volumes?: Volume[];
    networks?: Network[];

    view: View = "containers";

    constructor(
        private http: HttpClient
    ) {
        this.ls("*");
    }

    setView(view: View) {
        this.view = view;
        this.ls(view);
    }

    private ls(view: View | "*") {
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
