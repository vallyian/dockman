import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { AppComponent } from './app.component';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AngularSvgIconModule.forRoot(),
        NgxJsonViewerModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
