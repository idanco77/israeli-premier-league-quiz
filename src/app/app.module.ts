import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClientModule} from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {ReactiveFormsModule} from '@angular/forms';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {ResultsDialogComponent} from 'src/app/results-dialog/results-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import { ScreenTrackingService,UserTrackingService } from '@angular/fire/analytics';
import * as firebase from 'firebase/app';
import {environment} from 'src/environment/environment';
import {HeaderComponent} from 'src/app/header/header.component';
import {UserLevelService} from 'src/app/shared/services/user-level.service';
import {AutocompleteComponent} from 'src/app/autocomplete/autocomplete.component';
import {AutocompleteService} from 'src/app/shared/services/autocomplete.service';
import {PlayersDataService} from 'src/app/shared/services/players-data.service';
import {QuizComponent} from 'src/app/quiz/quiz.component';
import {GuessesService} from 'src/app/shared/services/guesses.service';
import {KeyboardComponent} from 'src/app/keyboard/keyboard.component';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {MatTooltipModule} from '@angular/material/tooltip';

firebase.initializeApp(environment.firebase);

@NgModule({
  declarations: [
    AppComponent,
    ResultsDialogComponent,
    HeaderComponent,
    AutocompleteComponent,
    QuizComponent,
    KeyboardComponent
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
    MatButtonModule,
    MatIconModule,
    FontAwesomeModule,
    MatTooltipModule,
  ],
  providers: [
    UserTrackingService,
    AutocompleteService,
    PlayersDataService,
    ScreenTrackingService,
    UserLevelService,
    GuessesService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
