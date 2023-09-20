import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
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
import {Colors} from 'src/app/shared/types/colors.type';
import {PlayersDataService} from 'src/app/shared/services/players-data.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {ResultsDialogComponent} from 'src/app/results-dialog/results-dialog.component';
import {AutocompleteService} from 'src/app/shared/services/autocomplete.service';
import {MatDialog} from '@angular/material/dialog';
import {keyMapper} from 'src/app/shared/consts/key-mapper.const';
import {DELETE, ENTER} from 'src/app/shared/consts/key-names.const';
import {mapPlayerDetails} from 'src/app/shared/consts/player-detail-mapper.const';

@Component({
    selector: 'app-keyboard',
    templateUrl: './keyboard.component.html',
    styleUrls: ['./keyboard.component.scss']
})
export class KeyboardComponent implements OnInit, OnDestroy {
    readonly firstKeyboardRow = FIRST_KEYBOARD_ROW;
    readonly secondKeyboardRow = SECOND_KEYBOARD_ROW;
    readonly thirdKeyboardRow = THIRD_KEYBOARD_ROW;
    availableWords: string[] = [];
    isBeginner: boolean;
    isBeginnerSub: Subscription;
    guessesSub: Subscription;
    autocompleteValueSub: Subscription;
    keyboardKeys: Key[][] = [];
    isWin: boolean = false;
    currentGuess: number = FIRST_GUESS;
    currentLetter: number = FIRST_LETTER;
    guesses: Key[][] = [];
    winningWord: string[] = [];
    cachedWinningWord: string[] = [];
    details: PlayerDetail[] = [];

    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        this.handlePress(event.key);
    }

    constructor(private userLevel: UserLevelService,
                private guessesService: GuessesService,
                private playersDataService: PlayersDataService,
                private snackBar: MatSnackBar, private dialog: MatDialog,
                private autocompleteService: AutocompleteService) {
    }

    ngOnInit() {
        this.details = this.playersDataService.getPlayersData();
        this.availableWords = mapPlayerDetails([
            ...this.details.map((player: PlayerDetail) => player.lastName)]
        );
        this.setWinningWord();

        this.guessesSub = this.guessesService.guessesSub.subscribe((guesses: Key[][]) => {
            this.guesses = guesses;
        })
        this.isBeginnerSub = this.userLevel.isBeginner.subscribe((isBeginner: boolean) => {
            this.isBeginner = isBeginner;
        });

        this.autocompleteValueSub = this.autocompleteService.autocompleteOutput.subscribe((autocompleteValue: string[]) => {
            this.handleSelection(autocompleteValue);
        });

        this.initKeyboardKeys();
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

        this.checkResults(letterColors);
    }

    private setWinningWord(): void {
        // Select a random winning word
        const randomIndex: number = Math.floor(Math.random() * this.availableWords.length);
        const selectedWord: string = this.availableWords[randomIndex];

        // Split the winning word into an array and create a cached copy
        this.winningWord = selectedWord.split('');
        this.cachedWinningWord = [...this.winningWord];
    }

    private applyLettersColor(color: Colors, index: number, guess: Key[]): void {
        setTimeout(() => {
            guess[index][color] = true;
            this.guessesService.guessesSub.next(this.guesses);
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

    private checkResults(letterColors: Colors[]): void {
        const isEveryColorGreen = letterColors.every((color: Colors): boolean => color === 'isGreen');
        if (isEveryColorGreen) {
            this.isWin = true;
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
        const playerDetails = this.details.find((playerDetail: PlayerDetail): boolean =>
            playerDetail.lastName === this.cachedWinningWord.join('')
        ) as PlayerDetail;
        setTimeout(() => {
            this.dialog.open(ResultsDialogComponent, {
                data: {playerDetails, message: message}
            });
        }, 3000);

    }
}
