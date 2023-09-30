import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Key} from 'src/app/shared/models/guess.model';
import {MAX_GUESSES_ALLOWED, MAX_LETTERS_ALLOWED} from 'src/app/shared/consts/rules';
import {ActivatedRoute, Router} from '@angular/router';
import {getGameConst} from 'src/app/shared/consts/get-game.const';
@Injectable({
    providedIn: 'root'
})
export class GuessesService {
    constructor(private router: Router, private route: ActivatedRoute) {
    }
    guessesSub = new BehaviorSubject<Key[][]>(this.getGuesses());

    private getGuesses() {
        const game = getGameConst(this.router.url);
        if (localStorage.getItem(game + 'Guesses') && localStorage.getItem(game + 'KeyboardKeys')) {
            return (JSON.parse(localStorage.getItem(game + 'Guesses') || '[]'));
        }
        return Array.from({length: MAX_GUESSES_ALLOWED}, () =>
            Array.from({length: MAX_LETTERS_ALLOWED}, () => ({
                isGreen: false,
                isYellow: false,
                isGray: false,
                letter: ''
            })))
    }
}
