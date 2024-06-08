import {Component, HostListener, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {UserLevelService} from 'src/app/shared/services/user-level.service';
import {Key} from 'src/app/shared/models/guess.model';
import {
    FIRST_GUESS,
    FIRST_LETTER,
    LAST_LETTER,
    MAX_GUESSES_ALLOWED, OPTIONAL_TERMINAL_LETTERS_CODES,
    WORD_MAX_LENGTH
} from 'src/app/shared/consts/rules';
import {GuessesService} from 'src/app/shared/services/guesses.service';
import {
    FIRST_KEYBOARD_ROW,
    KEYBOARD,
    SECOND_KEYBOARD_ROW,
    THIRD_KEYBOARD_ROW
} from 'src/app/shared/consts/keyboard.const';
import {Color} from 'src/app/shared/types/colors.type';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {ResultsDialogComponent} from 'src/app/shared/components/results-dialog/results-dialog.component';
import {AutocompleteService} from 'src/app/shared/services/autocomplete.service';
import {MatDialog} from '@angular/material/dialog';
import {keyMapper} from 'src/app/shared/consts/key-mapper.const';
import {DELETE, ENTER} from 'src/app/shared/consts/key-names.const';
import {Game} from 'src/app/shared/types/games.type';
import {getDetails} from 'src/app/shared/consts/get-details.const';
import {getAvailableWords} from 'src/app/shared/consts/get-available-words.const';

@Component({
    selector: 'app-keyboard',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit, OnDestroy {
    readonly firstKeyboardRow = FIRST_KEYBOARD_ROW;
    readonly secondKeyboardRow = SECOND_KEYBOARD_ROW;
    readonly thirdKeyboardRow = THIRD_KEYBOARD_ROW;

    @Input() game: Game;

    isBeginnerSub: Subscription;
    guessesSub: Subscription;
    autocompleteValueSub: Subscription;

    isBeginner: boolean;
    keyboardKeys: Key[][] = [];

    details: PlayerDetail[] | string[] = [];
    availableWords: string[] = [];
    chosenWord: string[] = [];


    currentLetter: number = FIRST_LETTER;
    currentGuess: number = FIRST_GUESS;
    guesses: Key[][] = [];
    cachedChosenWord: string[] = [];
    isWin: boolean = false;

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        this.handlePress(event.key);
    }

    constructor(private userLevel: UserLevelService,
                private guessesService: GuessesService,
                private snackBar: MatSnackBar, private dialog: MatDialog,
                private autocompleteService: AutocompleteService) {
    }

    ngOnInit() {
      const date = localStorage.getItem('date');
      console.log(date);
      console.log(this.getCurrentDateInUTC());
      this.details = getDetails(this.game);
      this.availableWords = getAvailableWords(this.game, this.details);
      this.setChosenWord();

      this.guessesSub = this.guessesService.guessesSub.subscribe((guesses: Key[][]) => {
        this.guesses = guesses;
      });

      this.isBeginnerSub = this.userLevel.isBeginner.subscribe((isBeginner: boolean) => {
        this.isBeginner = isBeginner;
      });

      this.autocompleteValueSub = this.autocompleteService.autocompleteOutput.subscribe((autocompleteValue: string[]) => {
        this.handleSelection(autocompleteValue);
      });

      this.currentGuess = this.findCurrentGuessIndex();

      this.initKeyboardKeys();
      this.checkIsWin();
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

    private initKeyboardKeys(): void {
        if (localStorage.getItem(this.game + 'KeyboardKeys') && localStorage.getItem(this.game + 'Guesses')) {
            this.keyboardKeys = JSON.parse(localStorage.getItem(this.game + 'KeyboardKeys') || '[]');
            return;
        }
        this.keyboardKeys = KEYBOARD.map((keyboardRow: string[]) =>
            keyboardRow.map((letter: string): Key => ({
                letter,
                isGray: false,
                isYellow: false,
                isGreen: false,
            }))
        );
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
        this.guessesService.guessesSub.next(this.guesses);
        this.currentLetter++;
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

    checkWord(): void {
      localStorage.setItem('date', this.getCurrentDateInUTC());
      if (this.currentGuess >= MAX_GUESSES_ALLOWED) {
            return;
        }

        const guess: Key[] = this.guesses[this.currentGuess];
        if (!guess[LAST_LETTER].letter) {
            return;
        }

        this.chosenWord = [... this.cachedChosenWord];
        const guessLetters: string[] = guess.map((letterData: Key) => letterData.letter);

        if (! this.availableWords.includes(guessLetters.join(''))) {
            const message = {
                israeliPremierLeague: 'השחקן',
                cities: 'היישוב',
            }
            this.snackBar.open(message[this.game] + ' לא נמצא ברשימה', 'X', {
                duration: 1000,
                verticalPosition: 'top'
            });
            return;
        }

        if (OPTIONAL_TERMINAL_LETTERS_CODES.includes(guessLetters[LAST_LETTER].charCodeAt(0) + 1)) {
            guessLetters[LAST_LETTER] = String.fromCharCode(
                guessLetters[LAST_LETTER].charCodeAt(0) + 1
            );
        }

        const letterColors: Color[] = [];

        // loop over the guess:
        for (let guessLetterIndex = 0; guessLetterIndex < guess.length; guessLetterIndex++) {

            // check is green:
            if (guessLetters[guessLetterIndex].charCodeAt(0) === this.chosenWord[guessLetterIndex].charCodeAt(0)) {
                letterColors.push('isGreen');
                this.chosenWord[guessLetterIndex] = '';
                continue;
            }

            // check is gray:
            if (!this.chosenWord.includes(guessLetters[guessLetterIndex])) {
                letterColors.push('isGray');
                continue;
            }

            // check is already green:
            if (guessLetters[guessLetterIndex].charCodeAt(0) === this.chosenWord[guessLetterIndex].charCodeAt(0)) {
                continue;
            }

            // check is already green:
            const chosenWordIndex = this.chosenWord.indexOf(guessLetters[guessLetterIndex]);
            if (guessLetters[chosenWordIndex] === this.chosenWord[chosenWordIndex]) {
                letterColors.push('isGray');
                continue;
            }

            this.chosenWord[chosenWordIndex] = '';
            letterColors.push('isYellow');
        }

        letterColors.forEach((color: Color, index: number): void => {
            this.applyLettersColor(color, index, guess)
        });
        this.currentGuess++;
        this.currentLetter = FIRST_LETTER;
        this.checkResults(letterColors);
    }

    private setChosenWord(): void {
        if (localStorage.getItem(this.game + 'ChosenWord')) {
            this.chosenWord = JSON.parse(localStorage.getItem(this.game + 'ChosenWord') || '[]');
            this.cachedChosenWord = [...this.chosenWord];
            return;
        }

      const selectedWord = this.availableWords[this.getDifferenceInDays((new Date('2024-06-07')), new Date(new Date()))];
        // Split the word into an array and create a cached copy
        this.chosenWord = selectedWord.split('');
        const utf16code = this.chosenWord[4].charCodeAt(0) + 1;
        if (OPTIONAL_TERMINAL_LETTERS_CODES.includes(utf16code)) {
            this.chosenWord[this.chosenWord.length - 1] = String.fromCharCode(utf16code);
        }
        this.cachedChosenWord = [...this.chosenWord];
        localStorage.setItem(this.game + 'ChosenWord', JSON.stringify(this.chosenWord));
        localStorage.setItem(this.game + 'ChosenWordTimestamp', JSON.stringify(Math.floor(Date.now() / 1000)));

    }

    private applyLettersColor(color: Color, index: number, guess: Key[]): void {
        setTimeout(() => {
            guess[index][color] = true;
            this.guessesService.guessesSub.next(this.guesses);
            localStorage.setItem(this.game + 'Guesses', JSON.stringify(this.guesses));
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
            localStorage.setItem(this.game + 'KeyboardKeys', JSON.stringify(this.keyboardKeys));
        }, index * 500)
    }

    private handleColors(key: Key | undefined, color: Color): void {
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

    private checkResults(letterColors: Color[]): void {
        const isEveryColorGreen = letterColors.every((color: Color): boolean => color === 'isGreen');
      if (isEveryColorGreen) {
        this.isWin = true;
        localStorage.setItem(this.game + 'IsWin', JSON.stringify(true));
        this.openResultsDialog('כל הכבוד! ניצחת!');
      } else if (this.currentGuess === MAX_GUESSES_ALLOWED) {
        this.openResultsDialog('לא הצלחת. לא נורא נסה פעם הבאה');
      }

    }

    handleSelection(selectedPlayerArray: string[]): void {
        this.currentLetter = FIRST_LETTER;
        selectedPlayerArray.forEach((letter: string) => {
            this.press(letter.charCodeAt(0));
        });
        this.checkWord();
    }

    private mapKey(key: string): void {
        const processedKey = keyMapper(key);
        if (! processedKey) return;

        if (processedKey === ENTER) {
            this.checkWord();
            return;
        }

        if (processedKey === DELETE) {
            this.deleteLetter();
            return;
        }
        this.press(processedKey.charCodeAt(0));
    }

    private handlePress(key: string): void {
        if (this.isBeginner) {
            return;
        }
        this.mapKey(key)
    }

    ngOnDestroy() {
        this.guessesSub.unsubscribe();
        this.isBeginnerSub.unsubscribe();
        this.autocompleteValueSub.unsubscribe();
    }

    private openResultsDialog(message: string) {
        const resultData = this.game === 'israeliPremierLeague'
            ? (this.details as PlayerDetail[]).find((playerDetail: PlayerDetail): boolean =>
                playerDetail.lastName === this.cachedChosenWord.join('')
            ) as PlayerDetail
            :
            this.cachedChosenWord
        ;
        setTimeout(() => {
            this.dialog.open(ResultsDialogComponent, {
                data: {
                    game: this.game,
                    resultData: resultData,
                    message: message
                }
            });
        }, 3000);

    }

    private checkIsWin() {
        if (this.currentGuess === 0) {
            return;
        }
        const guess: Key[] = this.guesses[this.currentGuess - 1];
        const letterColors: Color[] = [];
        guess.forEach((letter, index) => {
            if (letter.isGreen) {
                letterColors[index] = 'isGreen';
            }
            if (letter.isYellow) {
                letterColors[index] = 'isYellow';
            }
            if (letter.isGray) {
                letterColors[index] = 'isGray';
            }
        });
        this.checkResults(letterColors);
    }

    private findCurrentGuessIndex() {
        return this.guesses.findIndex((guess: Key[]) => {
            return guess[0].letter === '';
        });;
    }

  getDifferenceInDays(firstDate: Date, today: Date) {
    const num  = new Date(today).setHours(0, 0, 0, 0) - firstDate.setHours(0, 0, 0, 0);
    return Math.round(num / 864e5);
  }

  private getCurrentDateInUTC(): string {
    const currentDate = new Date();
    const offsetInMinutes = currentDate.getTimezoneOffset();
    const utcDate = new Date(currentDate.getTime() - offsetInMinutes * 60 * 1000);

    return utcDate.toISOString().split('T')[0];
  }

}
