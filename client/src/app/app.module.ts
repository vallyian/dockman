import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        AngularSvgIconModule.forRoot(),
        NgxJsonViewerModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
