import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { AngularSvgIconModule } from "angular-svg-icon";
import { NgxJsonViewerModule } from "ngx-json-viewer";
import { AppComponent } from "./app.component";
import { FormsModule } from "@angular/forms";

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        HttpClientModule,
        AngularSvgIconModule.forRoot(),
        NgxJsonViewerModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
