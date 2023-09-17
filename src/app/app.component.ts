import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {Guess} from 'src/app/shared/models/guess.model';
import {ApiService} from 'src/app/shared/services/api.service';
import {FormControl} from '@angular/forms';
import {map, Observable, startWith} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {WinDialogComponent} from 'src/app/win-dialog/win-dialog.component';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentLetter = -1;
  currentGuess = 0;
  guesses: any;
  availableWords: string[] = [];
  winningWord: string[] = [];
  cachedWinningWord: string[] = [];
  autocompleteAvailableWords: string[] = [];
  autocompleteControl = new FormControl('');
  difficultyControl = new FormControl('');
  filteredOptions: Observable<string[]> = new Observable<string[]>();
  isBeginner = false;
  details: PlayerDetail[] = [];
  isWin: boolean = false;
  pressedLetters: string[] = [];
  terminalLetters: number[] = [1499, 1502, 1504, 1508, 1510];

  constructor(private apiService: ApiService, private snackBar: MatSnackBar,
              private dialog: MatDialog) {}

  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handlePress(event.key);
  }

  ngOnInit() {
    this.handleAutocomplete();
    this.difficultyControl.valueChanges.subscribe(val => {
      this.isBeginner = !!val;
    })
    this.initGuesses();
    this.getData();
  }

  press(utf16code: number) {
    if (this.isWin) {
      return;
    }

    if (this.currentLetter > 3) {
      return;
    }
    this.currentLetter++;
    if (this.currentLetter === 4 && this.terminalLetters.includes(utf16code)) {
      utf16code = utf16code - 1;
    }

    this.guesses[this.currentGuess][this.currentLetter].letter = String.fromCharCode(utf16code);
  }

  checkWord() {
    this.winningWord = [... this.cachedWinningWord];
    const guess: Guess[] = this.guesses[this.currentGuess];

    if (!guess[4].letter) {
      return;
    }
    const guessLetters: string[] = guess.map((letterData: Guess) => letterData.letter);
    if (this.terminalLetters.includes(guessLetters[4].charCodeAt(0) + 1)) {
      guessLetters[4] = String.fromCharCode(guessLetters[4].charCodeAt(0) + 1);
    }

    if (! this.availableWords.includes(guessLetters.join(''))) {
      this.snackBar.open('השחקן לא נמצא ברשימת השחקנים', 'X', {
        duration: 1000,
        verticalPosition: 'top'
      })
      return;
    }

    const orderedByLettersResults: ('isGray' | 'isYellow' | 'isGreen') [] = [];
    // loop over the guess:
    for (let guessLetterIndex = 0; guessLetterIndex < guess.length; guessLetterIndex++) {
      // check is green:
      if (guessLetters[guessLetterIndex].charCodeAt(0) === this.winningWord[guessLetterIndex].charCodeAt(0)) {
        orderedByLettersResults.push('isGreen');
        this.winningWord[guessLetterIndex] = '';
        continue;
      }

      // check is yellow:
      if (!this.winningWord.includes(guessLetters[guessLetterIndex])) {
        orderedByLettersResults.push('isGray');
        continue;
      }

      /*
      answer: revivo. guess: xevxxx:
      don't mark the second v of answer as yellow because it is
      already green:
      */
      if (guessLetters[guessLetterIndex].charCodeAt(0) === this.winningWord[guessLetterIndex].charCodeAt(0)) {
        continue;
      }

      // get the index of the answer letter
      const ind = this.winningWord.indexOf(guessLetters[guessLetterIndex]);

      /*
       answer: revivo. guess: rrxxxx:
       don't mark the second r as yellow because
       the first r already marked as green
     */
      if (guessLetters[ind] === this.winningWord[ind]) {
        orderedByLettersResults.push('isGray');
        continue;
      }

      this.winningWord[ind] = '';
      orderedByLettersResults.push('isYellow');
    }
    orderedByLettersResults.forEach((color, index) => {
      setTimeout(() => {
        guess[index][color] = true;
      }, index * 500);
    });
    this.currentGuess++;
    this.currentLetter = -1;
    guessLetters.forEach(letter => {
      if (this.terminalLetters.includes(letter.charCodeAt(0) + 1)) {
        letter = String.fromCharCode(letter.charCodeAt(0) + 1);
      }
      this.pressedLetters.push(letter);
    });
    if (orderedByLettersResults.every(color => color === 'isGreen')) {
      this.isWin = true;
      const playerDetails = this.details.find((playerDetail: PlayerDetail) => playerDetail.lastName === this.cachedWinningWord.join(''));
      setTimeout(() => {
        this.dialog.open(WinDialogComponent, {
          data: playerDetails
        });
      }, 3000);
    }
  }

  deleteLetter() {
    if (this.currentLetter < 0) {
      this.currentLetter = -1;
      return;
    }
    this.guesses[this.currentGuess][this.currentLetter].letter = '';
    this.currentLetter--;
  }

  private handlePress(key: string) {
    if (this.isBeginner) {
      if (key === 'Enter') {
        const filteredList = this.autocompleteAvailableWords.filter(option => option.includes(this.autocompleteControl.value || ''));
        if (filteredList.length) {
          this.handleSelection(filteredList[0].split(''));
          this.autocomplete?.closePanel();
        }
      }
      return;
    }

    switch (key) {
      case 'Enter':
        this.checkWord();
        break;
      case 'Backspace':
      case 'Delete':
        this.deleteLetter();
        break;
      case '\'':
      case 'w':
      case 'W':
        this.press('\''.charCodeAt(0));
        break;
      case 'א':
      case 'T':
      case 't':
        this.press('א'.charCodeAt(0));
        break;
      case 'ב':
      case 'C':
      case 'c':
        this.press('ב'.charCodeAt(0));
        break;
      case 'ג':
      case 'D':
      case 'd':
        this.press('ג'.charCodeAt(0));
        break;
      case 'ד':
      case 'S':
      case 's':
        this.press('ד'.charCodeAt(0));
        break;
      case 'ה':
      case 'V':
      case 'v':
        this.press('ה'.charCodeAt(0));
        break;
      case 'ו':
      case 'u':
      case 'U':
        this.press('ו'.charCodeAt(0));
        break;
      case 'ז':
      case 'Z':
      case 'z':
        this.press('ז'.charCodeAt(0));
        break;
      case 'ח':
      case 'J':
      case 'j':
        this.press('ח'.charCodeAt(0));
        break;
      case 'ט':
      case 'Y':
      case 'y':
        this.press('ט'.charCodeAt(0));
        break;
      case 'י':
      case 'h':
      case 'H':
        this.press('י'.charCodeAt(0));
        break;
      case 'כ':
      case 'F':
      case 'f':
      case 'ך':
      case 'L':
      case 'l':
        this.press('כ'.charCodeAt(0));
        break;
      case 'ל':
      case 'k':
      case 'K':
        this.press('ל'.charCodeAt(0));
        break;
      case 'מ':
      case 'N':
      case 'n':
      case 'ם':
      case 'O':
      case 'o':
        this.press('מ'.charCodeAt(0));
        break;
      case 'נ':
      case 'b':
      case 'B':
      case 'ן':
      case 'I':
      case 'i':
        this.press('נ'.charCodeAt(0));
        break;
      case 'ס':
      case 'X':
      case 'x':
        this.press('ס'.charCodeAt(0));
        break;
      case 'ע':
      case 'G':
      case 'g':
        this.press('ע'.charCodeAt(0));
        break;
      case 'פ':
      case 'p':
      case 'P':
      case 'ף':
      case ';':
        this.press('פ'.charCodeAt(0));
        break;
      case 'צ':
      case 'M':
      case 'm':
      case 'ץ':
      case '.':
        this.press('צ'.charCodeAt(0));
        break;
      case 'ק':
      case 'E':
      case 'e':
        this.press('ק'.charCodeAt(0));
        break;
      case 'ר':
      case 'r':
      case 'R':
        this.press('ר'.charCodeAt(0));
        break;
      case 'ש':
      case 'a':
      case 'A':
        this.press('ש'.charCodeAt(0));
        break;
      case 'ת':
      case ',':
        this.press('ת'.charCodeAt(0));
        break;
      default:
        break;
    }
  }

  private initGuesses() {
    this.guesses = [];
    for (let i = 0; i <= 5; i++) {
      this.guesses.push([]);
      for (let j = 0; j <= 4; j++) {
        this.guesses[i].push({isGreen: false, isYellow: false, isGray: false, letter: ''});
      }
    }
  }

  private getData() {
    if (localStorage.getItem('availableWords') && localStorage.getItem('details') && localStorage.getItem('autocompleteAvailableWords')) {
      this.availableWords = JSON.parse(localStorage.getItem('availableWords') || '[]');
      this.details = JSON.parse(localStorage.getItem('details') || '[]');
      this.autocompleteAvailableWords = JSON.parse(localStorage.getItem('autocompleteAvailableWords') || '[]');

      this.setWinningWord();
      return;
    }
    this.apiService.getData().subscribe(response => {
      this.details = Object.values(response.data)
        // filter only season 23/24 and israeli premier league players
        .filter((player: any) => player.leagues.hasOwnProperty('23/24') && player.leagues['23/24'] === 902)
        .map((player: any) => {
          return {
            name: player.hebrewName,
            lastName: this.removeTerminalLetter(player.lastName),
            lastNameTerminalLetters: player.lastName,
            position: player.hebrewPosition,
            age: player.dateOfBirth?.sec ? this.getAge(new Date(player.dateOfBirth?.sec * 1000)) : '',
            shirtNumber: player.shirtNumber,
            team: player.teamId.hebrewName,
            teamLogo: player.teamId.logoUrl,
            coachName: player.teamId.hebrewCoachName
          }
        });
      this.availableWords = [... this.details]
        .map((player: any) => player.lastName)
        // filter duplicated last names
        .filter((lastName, index, currentVal) => currentVal.indexOf(lastName) === index)
        .filter(lastName => lastName?.length === 5)
        .filter(lastName => !/[A-Z][a-z]/.test(lastName));
      this.autocompleteAvailableWords = [... this.details]
        .map((player: any) => player.lastNameTerminalLetters)
        // filter duplicated last names
        .filter((lastName, index, currentVal) => currentVal.indexOf(lastName) === index)
        .filter(lastName => lastName?.length === 5)
        .filter(lastName => !/[A-Z][a-z]/.test(lastName));

      localStorage.setItem('details', JSON.stringify(this.details));
      localStorage.setItem('availableWords', JSON.stringify(this.availableWords));
      localStorage.setItem('autocompleteAvailableWords', JSON.stringify(this.autocompleteAvailableWords));

      this.setWinningWord();
    });
  }

  getAge(birthdate: Date): any {
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const m = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }

  private setWinningWord() {
    this.winningWord = this.availableWords
      [Math.floor(Math.random() * this.availableWords.length)]
      .split('');
    this.cachedWinningWord = [...this.winningWord];
  }

  handleSelection(selectedPlayerArray: string[]) {
    this.currentLetter = -1;
    selectedPlayerArray.forEach(letter => this.press(letter.charCodeAt(0)));
    this.checkWord();
    this.autocompleteControl.reset();
  }

  private removeTerminalLetter(name: string): string {
    let nameArray = name.split('');
    let lastLetter = nameArray[4];
    if (! lastLetter) {
      return '';
    }
    const isTerminalLetter = this.terminalLetters.includes(lastLetter.charCodeAt(0) + 1);
    if (isTerminalLetter) {
      // convert to regular letter:
      lastLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
      nameArray[4] = lastLetter;
    }
    return nameArray.join('');
  }

  private handleAutocomplete() {
    this.filteredOptions = this.autocompleteControl.valueChanges.pipe(
      startWith(''),
      map(value => this.autocompleteAvailableWords.filter(option => option.includes(value || ''))),
    );
  }
}
