import {Component, OnDestroy, OnInit} from '@angular/core';
import {GuessesService} from 'src/app/shared/services/guesses.service';
import {Subscription} from 'rxjs';
import {Key} from 'src/app/shared/models/guess.model';

@Component({
    selector: 'app-quiz',
    templateUrl: './quiz.component.html',
    styleUrls: ['./quiz.component.scss']
})
export class QuizComponent implements OnInit, OnDestroy {
    guessesSub: Subscription;
    guesses: Key[][];

    constructor(private guessesService: GuessesService) {
    }

    ngOnInit(): void {
        this.guessesSub = this.guessesService.guessesSub.subscribe((guesses: Key[][]) => {
            this.guesses = guesses;
        })
    }

    ngOnDestroy(): void {
        this.guessesSub.unsubscribe();
    }
}
