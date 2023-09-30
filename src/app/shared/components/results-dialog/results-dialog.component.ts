import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';
import {Game} from 'src/app/shared/types/games.type';
import {OPTIONAL_TERMINAL_LETTERS_CODES} from 'src/app/shared/consts/rules';

@Component({
  templateUrl: './results-dialog.component.html',
  styleUrls: ['./results-dialog.component.scss']
})
export class ResultsDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {resultData: any, message: string, game: Game}) {
  }

  ngOnInit() {
    if (this.data.game === 'cities') {
      const lastLetterUTF16 = this.data.resultData[this.data.resultData.length - 1].charCodeAt(0);
      if (OPTIONAL_TERMINAL_LETTERS_CODES.includes(lastLetterUTF16)) {
        this.data.resultData[this.data.resultData.length - 1] = String.fromCharCode(lastLetterUTF16 - 1);
      }
    }
  }
}
