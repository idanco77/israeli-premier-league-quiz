import {Component, OnInit} from '@angular/core';
import {Game} from 'src/app/shared/types/games.type';
import {getGameConst} from 'src/app/shared/consts/get-game.const';
import {Router} from '@angular/router';
import {showWelcomeMessage} from 'src/app/shared/consts/show-welcome-message.const';

@Component({
    templateUrl: './israeli-premier-league.component.html'
})
export class IsraeliPremierLeagueComponent implements OnInit {
    constructor(private router: Router) {
    }
    game: Game = getGameConst(this.router.url) as Game;

    ngOnInit() {
      const isWin = JSON.parse(localStorage.getItem(this.game + 'IsWin') || 'false');
      if (isWin) {
        return;
      }
      showWelcomeMessage(
        'יש לגלות שם משפחה של שחקן כדורגל מליגת העל שמכיל בדיוק 5 אותיות.' +
        ' עונת 2023-2024 '
      );
    }
}
