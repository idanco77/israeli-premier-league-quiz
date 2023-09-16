import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import {ApiService} from 'src/app/shared/services/api.service';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {ReactiveFormsModule} from '@angular/forms';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {WinDialogComponent} from 'src/app/win-dialog/win-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import { ScreenTrackingService,UserTrackingService } from '@angular/fire/analytics';
import * as firebase from 'firebase/app';
import {environment} from 'src/environment/environment';

firebase.initializeApp(environment.firebase);

@NgModule({
  declarations: [
    AppComponent,
    WinDialogComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  providers: [
    ApiService,
    ScreenTrackingService,UserTrackingService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
