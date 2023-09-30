import {Component, OnInit} from '@angular/core';
import {Game} from 'src/app/shared/types/games.type';
import {getGameConst} from 'src/app/shared/consts/get-game.const';
import {Router} from '@angular/router';
import {refreshAfter1Hour} from 'src/app/shared/consts/refresh-after-1-hour.const';
declare const swal: any;

@Component({
    templateUrl: './cities.component.html'
})
export class CitiesComponent implements OnInit {
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
            html: 'יש לגלות שם של יישוב בארץ שמכיל בדיוק 5 אותיות',
            showCloseButton: true,
            focusConfirm: false,
            confirmButtonText:
                '<i class="fa fa-thumbs-up"></i> צא לדרך!',
            confirmButtonAriaLabel: 'Thumbs up, great!',
            timer: 8000,
        });
    }
}
