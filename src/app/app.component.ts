import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {Key} from 'src/app/shared/models/guess.model';
import {ApiService} from 'src/app/shared/services/api.service';
import {FormControl} from '@angular/forms';
import {map, Observable, startWith} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {WinDialogComponent} from 'src/app/win-dialog/win-dialog.component';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';
import { FIRST_KEYBOARD_ROW, KEYBOARD, SECOND_KEYBOARD_ROW, THIRD_KEYBOARD_ROW} from 'src/app/shared/consts/KEYBOARD';
import {Colors} from 'src/app/shared/types/colors.type';
import {
  FIRST_GUESS,
  FIRST_LETTER,
  LAST_LETTER,
  MAX_GUESSES_ALLOWED, MAX_LETTERS_ALLOWED,
  OPTIONAL_TERMINAL_LETTERS_CODES,
  WORD_MAX_LENGTH
} from 'src/app/shared/consts/rules';
import {UTF_CONVERTER} from 'src/app/shared/consts/key-mapping';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  currentLetter: number = FIRST_LETTER;
  currentGuess: number = FIRST_GUESS;
  guesses: Key[][] = [];
  availableWords: string[] = [];
  winningWord: string[] = [];
  cachedWinningWord: string[] = [];
  autocompleteAvailableWords: string[] = [];
  autocompleteControl: FormControl<string | null> = new FormControl('');
  userLevel: FormControl<string | null> = new FormControl('');
  filteredOptions: Observable<string[]> = new Observable<string[]>();
  isBeginner: boolean = false;
  details: PlayerDetail[] = [];
  isWin: boolean = false;
  keyboardKeys: Key[][] = [];
  numberOfWords: number[] = Array.from(Array(MAX_GUESSES_ALLOWED).keys());
  readonly numberOfLetters: number[] = Array.from(Array(MAX_LETTERS_ALLOWED).keys());
  readonly FIRST_KEYBOARD_ROW = FIRST_KEYBOARD_ROW;
  readonly SECOND_KEYBOARD_ROW = SECOND_KEYBOARD_ROW;
  readonly THIRD_KEYBOARD_ROW = THIRD_KEYBOARD_ROW;

  constructor(private apiService: ApiService, private snackBar: MatSnackBar,
              private dialog: MatDialog) {}

  @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger | undefined;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.handlePress(event.key);
  }

  ngOnInit(): void {
    this.initKeyboardKeys();
    this.handleAutocomplete();
    this.checkUserLevelSelection();
    this.initGuesses();
    this.getPlayersData();
  }

  press(utf16code: number): void {
    if (this.isWin) {
      return;
    }

    if (this.currentGuess >= MAX_GUESSES_ALLOWED) {
      return;
    }

    if (this.currentLetter > WORD_MAX_LENGTH) {
      return;
    }

    this.guesses[this.currentGuess][this.currentLetter].regularLetter = String.fromCharCode(utf16code);
    utf16code = this.convertRegularLetterToTerminal(utf16code);
    this.guesses[this.currentGuess][this.currentLetter].letter = String.fromCharCode(utf16code);
    this.currentLetter++;
  }

  checkWord(): void {
    if (this.currentGuess >= MAX_GUESSES_ALLOWED) {
      return;
    }

    const guess: Key[] = this.guesses[this.currentGuess];
    if (!guess[LAST_LETTER].letter) {
      return;
    }

    this.winningWord = [... this.cachedWinningWord];
    const guessLetters: string[] = guess.map((letterData: Key) => letterData.letter);

    if (OPTIONAL_TERMINAL_LETTERS_CODES.includes(guessLetters[LAST_LETTER].charCodeAt(0) + 1)) {
      guessLetters[LAST_LETTER] = String.fromCharCode(
          guessLetters[LAST_LETTER].charCodeAt(0) + 1
      );
    }

    if (! this.availableWords.includes(guessLetters.join(''))) {
      this.snackBar.open('השחקן לא נמצא ברשימת השחקנים', 'X', {
        duration: 1000,
        verticalPosition: 'top'
      });
      return;
    }

    const letterColors: Colors[] = [];

    // loop over the guess:
    for (let guessLetterIndex = 0; guessLetterIndex < guess.length; guessLetterIndex++) {

      // check is green:
      if (guessLetters[guessLetterIndex].charCodeAt(0) === this.winningWord[guessLetterIndex].charCodeAt(0)) {
        letterColors.push('isGreen');
        this.winningWord[guessLetterIndex] = '';
        continue;
      }

      // check is gray:
      if (!this.winningWord.includes(guessLetters[guessLetterIndex])) {
        letterColors.push('isGray');
        continue;
      }

      // check is already green:
      if (guessLetters[guessLetterIndex].charCodeAt(0) === this.winningWord[guessLetterIndex].charCodeAt(0)) {
        continue;
      }

      // check is already green:
      const winningWordIndex = this.winningWord.indexOf(guessLetters[guessLetterIndex]);
      if (guessLetters[winningWordIndex] === this.winningWord[winningWordIndex]) {
        letterColors.push('isGray');
        continue;
      }

      this.winningWord[winningWordIndex] = '';
      letterColors.push('isYellow');
    }

    letterColors.forEach((color: Colors, index: number): void => {
      this.applyLettersColor(color, index, guess)
    });
    this.currentGuess++;
    this.currentLetter = FIRST_LETTER;

    this.checkIsWin(letterColors);
  }

  deleteLetter(): void {
    if (this.currentGuess >= MAX_GUESSES_ALLOWED || this.isWin) {
      return;
    }

    if (this.currentLetter <= FIRST_LETTER) {
      this.currentLetter = FIRST_LETTER;
      return;
    }
    this.currentLetter--;
    this.guesses[this.currentGuess][this.currentLetter].letter = '';
  }

  private handlePress(key: string): void {
    if (this.isBeginner) {
      this.closeAutocompleteOnEnter(key);
      return;
    }

    if (key === 'Enter') {
      this.checkWord();
    } else if (['Backspace', 'Delete'].includes(key)) {
      this.deleteLetter();
    } else {
      this.press(UTF_CONVERTER[key]);
    }
  }

  private initGuesses(): void {
    this.guesses = Array.from({length: MAX_GUESSES_ALLOWED}, () =>
        Array.from({length: MAX_LETTERS_ALLOWED}, () => ({
          isGreen: false,
          isYellow: false,
          isGray: false,
          letter: ''
        })));
  }

  private getPlayersData(): void {
    if (localStorage.getItem('availableWords') &&
        localStorage.getItem('details') &&
        localStorage.getItem('autocompleteAvailableWords')) {
      this.availableWords = JSON.parse(localStorage.getItem('availableWords') || '[]');
      this.details = JSON.parse(localStorage.getItem('details') || '[]');
      this.autocompleteAvailableWords = JSON.parse(localStorage.getItem('autocompleteAvailableWords') || '[]');

      this.setWinningWord();
      return;
    }

    this.apiService.getPlayersData().subscribe(response => {
      this.details = Object.values(response.data)
          .filter((player: any, index: number, currentVal: any[]) =>
              player.leagues.hasOwnProperty('23/24') &&
              player.leagues['23/24'] === 902 &&
              player.lastName?.length === MAX_LETTERS_ALLOWED &&
              !/[A-Z][a-z]/.test(player.lastName)
          )
          .map((player: any) => this.createPlayerDetail(player));

      this.availableWords = this.mapPlayerDetails([...this.details.map((player: PlayerDetail) => player.lastName)]);
      this.autocompleteAvailableWords = this.mapPlayerDetails([...this.details.map((player: PlayerDetail) => player.lastNameTerminalLetters)]);

      localStorage.setItem('details', JSON.stringify(this.details));
      localStorage.setItem('availableWords', JSON.stringify(this.availableWords));
      localStorage.setItem('autocompleteAvailableWords', JSON.stringify(this.autocompleteAvailableWords));

      this.setWinningWord();
    });
  }

  getAge(birthdate: Date): number {
    const today: Date = new Date();
    let age: number = today.getFullYear() - birthdate.getFullYear();
    const m: number = today.getMonth() - birthdate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
      age--;
    }
    return age;
  }

  private setWinningWord(): void {
    // Select a random winning word
    const randomIndex: number = Math.floor(Math.random() * this.availableWords.length);
    const selectedWord: string = this.availableWords[randomIndex];

    // Split the winning word into an array and create a cached copy
    this.winningWord = selectedWord.split('');
    this.cachedWinningWord = [...this.winningWord];
  }

  handleSelection(selectedPlayerArray: string[]): void {
    this.currentLetter = FIRST_LETTER;
    selectedPlayerArray.forEach(letter => this.press(letter.charCodeAt(0)));
    this.checkWord();
    this.autocompleteControl.reset();
  }

  private terminalToRegularWord(word: string): string {
    let wordArray = word.split('');
    let lastLetter = wordArray[LAST_LETTER];
    if (! lastLetter) {
      return '';
    }
    const isTerminalLetter: boolean = OPTIONAL_TERMINAL_LETTERS_CODES.includes(lastLetter.charCodeAt(0) + 1);
    if (isTerminalLetter) {
      // convert to regular letter:
      lastLetter = String.fromCharCode(lastLetter.charCodeAt(0) + 1);
      wordArray[LAST_LETTER] = lastLetter;
    }
    return wordArray.join('');
  }

  private handleAutocomplete(): void {
    this.filteredOptions = this.autocompleteControl.valueChanges.pipe(
      startWith(''),
      map(value => this.autocompleteAvailableWords.filter(
          option => option.includes(value || '')
      )),
    );

  }

  private checkUserLevelSelection(): void {
    this.userLevel.valueChanges.subscribe((val: string | null): void => {
      this.isBeginner = !!val;
    })
  }

  private initKeyboardKeys(): void {
    this.keyboardKeys = KEYBOARD.map((keyboardRow: string[]) =>
        keyboardRow.map((letter: string): Key => ({
          letter,
          isGray: false,
          isYellow: false,
          isGreen: false,
        }))
    );
  }

  private handleColors(key: Key | undefined, color: Colors): void {
    if (!key) { return }
    if (color === 'isGreen') {
      key['isGreen'] = true;
      key['isYellow'] = false;
      key['isGray'] = false;
      return;
    }
    if (color === 'isYellow' && ! key.isGreen) {
      key['isYellow'] = true;
      key['isGray'] = false;
      return;
    }
    if (color === 'isGray' && ! key.isGreen && ! key.isYellow) {
      key['isGray'] = true;
    }
  }

  private mapPlayerDetails(inputArray: string[]): any {
    return inputArray
        .map((player: any) => player)
        .filter((lastName, index: number, currentVal: any[]) =>
            currentVal.indexOf(lastName) === index
        );
  }

  createPlayerDetail(player: any): PlayerDetail {
    const { dateOfBirth, teamId, hebrewName, hebrewPosition, shirtNumber, lastName } = player;
    return {
      age: dateOfBirth?.sec ? this.getAge(new Date(dateOfBirth.sec * 1000)) : null,
      coachName: teamId.hebrewCoachName,
      name: hebrewName,
      position: hebrewPosition,
      shirtNumber,
      team: teamId.hebrewName,
      teamLogo: teamId.logoUrl,
      lastName: this.terminalToRegularWord(lastName),
      lastNameTerminalLetters: lastName,
    };
  }

  private convertRegularLetterToTerminal(utf16code: number): number {
    const shouldConvertRegularToTerminal = this.currentLetter === LAST_LETTER &&
        OPTIONAL_TERMINAL_LETTERS_CODES.includes(utf16code);

    if (shouldConvertRegularToTerminal) {
      this.guesses[this.currentGuess][this.currentLetter].regularLetter = String.fromCharCode(utf16code);
      utf16code = utf16code - 1;
    }

    return utf16code;
  }

  private applyLettersColor(color: Colors, index: number, guess: Key[]): void {
    setTimeout(() => {
      guess[index][color] = true;

      const letter = guess[index].regularLetter;
      const rows: Key[][] = [
        this.keyboardKeys[FIRST_KEYBOARD_ROW],
        this.keyboardKeys[SECOND_KEYBOARD_ROW],
        this.keyboardKeys[THIRD_KEYBOARD_ROW]
      ];

      rows.forEach((row: Key[]):void => {
        const key: Key | undefined = row.find(key => key.letter === letter);
        this.handleColors(key, color);
      });
    }, index * 500)
  }

  private checkIsWin(letterColors: Colors[]): void {
    if (letterColors.every((color: Colors): boolean => color === 'isGreen')) {
      this.isWin = true;
      const playerDetails = this.details.find((playerDetail: PlayerDetail): boolean =>
          playerDetail.lastName === this.cachedWinningWord.join('')
      );
      setTimeout(() => {
        this.dialog.open(WinDialogComponent, {
          data: playerDetails
        });
      }, 3000);
    }
  }

  private closeAutocompleteOnEnter(key: string): void {
    if (key === 'Enter' && this.autocomplete?.panelOpen) {
      const filteredList = this.autocompleteAvailableWords.filter(option => option.includes(this.autocompleteControl.value || ''));
      if (filteredList.length) {
        this.handleSelection(filteredList[0].split(''));
        this.autocomplete?.closePanel();
      }
    }
  }
}
