import {Component, HostListener, OnInit} from '@angular/core';
import {Key} from 'src/app/shared/models/guess.model';
import {Subscription} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {WinDialogComponent} from 'src/app/win-dialog/win-dialog.component';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
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
import {UserLevelService} from 'src/app/shared/services/user-level.service';
import {PlayersDataService} from 'src/app/shared/services/players-data.service';
import {AutocompleteService} from 'src/app/shared/services/autocomplete.service';

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
  playerDetailsSub: Subscription;
  availableWordsSub: Subscription;

  isBeginner: boolean = false;
  details: PlayerDetail[] = [];
  isWin: boolean = false;
  keyboardKeys: Key[][] = [];
  numberOfWords: number[] = Array.from(Array(MAX_GUESSES_ALLOWED).keys());
  readonly numberOfLetters: number[] = Array.from(Array(MAX_LETTERS_ALLOWED).keys());
  readonly FIRST_KEYBOARD_ROW = FIRST_KEYBOARD_ROW;
  readonly SECOND_KEYBOARD_ROW = SECOND_KEYBOARD_ROW;
  readonly THIRD_KEYBOARD_ROW = THIRD_KEYBOARD_ROW;
  isBeginnerSub: Subscription;

  constructor(private snackBar: MatSnackBar,
              private dialog: MatDialog, private userLevelService: UserLevelService,
              private playersDataService: PlayersDataService,
              private autocompleteService: AutocompleteService) {}

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.handlePress(event.key);
  }

  ngOnInit(): void {
    this.playersDataService.setPlayersData();
    this.initKeyboardKeys();
    this.checkUserLevelSelection();
    this.initGuesses();
    this.getPlayersData();
    this.autocompleteService.autocompleteOutput.subscribe((autocompleteValue: string[]) => {
      this.handleSelection(autocompleteValue);
    })
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
      return;
    }
    this.mapKey(key)
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
    this.playerDetailsSub = this.playersDataService.playerDetailsSub.subscribe((playerDetails: PlayerDetail[]) => {
      this.details = playerDetails;
    });
    this.availableWordsSub = this.playersDataService.availableWordsSub.subscribe((availableWords: string[]) => {
      this.availableWords = availableWords;
      this.setWinningWord();
    });

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
  }

  private checkUserLevelSelection(): void {
    this.isBeginnerSub = this.userLevelService.isBeginner.subscribe((isBeginner: boolean): void => {
      this.isBeginner = isBeginner;
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

  private mapKey(key: string): void {
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

  ngOnDestroy() {
    this.isBeginnerSub.unsubscribe();
    this.playerDetailsSub.unsubscribe();
    this.availableWordsSub.unsubscribe();
  }
}
