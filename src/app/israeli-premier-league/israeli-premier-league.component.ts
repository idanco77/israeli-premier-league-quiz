import {Component, OnInit} from '@angular/core';
import {refreshAfter1Hour} from 'src/app/shared/consts/refresh-after-1-hour.const';
import {Game} from 'src/app/shared/types/games.type';
import {getGameConst} from 'src/app/shared/consts/get-game.const';
import {Router} from '@angular/router';
declare const swal: any;

@Component({
    templateUrl: './israeli-premier-league.component.html'
})
export class IsraeliPremierLeagueComponent implements OnInit {
    constructor(private router: Router) {
    }
    game: Game = getGameConst(this.router.url) as Game;
    ngOnInit() {
        refreshAfter1Hour(this.game);
        const isWin = JSON.parse(localStorage.getItem(this.game + 'IsWin') || '[]');
        if (isWin) {
            return;
        }
        swal.fire({
            title: '<strong>ברוכים הבאים!</strong>',
            icon: 'info',
            html:
                'יש לגלות שם משפחה של שחקן כדורגל מליגת העל שמכיל בדיוק 5 אותיות.' +
                ' עונת 2023-2024 ',
            showCloseButton: true,
            focusConfirm: false,
            confirmButtonText:
                '<i class="fa fa-thumbs-up"></i> צא לדרך!',
            confirmButtonAriaLabel: 'Thumbs up, great!',
            timer: 8000,
        });
    }
}
