import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Key} from 'src/app/shared/models/guess.model';
import {MAX_GUESSES_ALLOWED, MAX_LETTERS_ALLOWED} from 'src/app/shared/consts/rules';
@Injectable({
    providedIn: 'root'
})
export class GuessesService {
    guessesSub = new BehaviorSubject<Key[][]>(Array.from({length: MAX_GUESSES_ALLOWED}, () =>
        Array.from({length: MAX_LETTERS_ALLOWED}, () => ({
            isGreen: false,
            isYellow: false,
            isGray: false,
            letter: ''
        }))));
}
