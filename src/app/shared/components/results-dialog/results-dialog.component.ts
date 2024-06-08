import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Game} from 'src/app/shared/types/games.type';
import {OPTIONAL_TERMINAL_LETTERS_CODES} from 'src/app/shared/consts/rules';

@Component({
  templateUrl: './results-dialog.component.html',
  styleUrls: ['./results-dialog.component.scss']
})
export class ResultsDialogComponent implements OnInit {
  hours: string | number;
  minutes: string | number;
  seconds: string | number;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {resultData: any, message: string, game: Game}) {
  }

  ngOnInit() {
    const timeRemaining = () => {
      const now: Date = new Date();
      const hoursLeft: number = 23 - now.getHours();
      const minutesLeft: number = 59 - now.getMinutes();
      const secondsLeft: number = 59 - now.getSeconds();

      const formatNumber = (num: number): string | number => (num < 10 ? '0' + num : num);

      this.hours = formatNumber(hoursLeft);
      this.minutes = formatNumber(minutesLeft);
      this.seconds = formatNumber(secondsLeft);
    };
    timeRemaining();
    setInterval(timeRemaining, 1000);

    if (this.data.game === 'cities') {
      const lastLetterUTF16 = this.data.resultData[this.data.resultData.length - 1].charCodeAt(0);
      if (OPTIONAL_TERMINAL_LETTERS_CODES.includes(lastLetterUTF16)) {
        this.data.resultData[this.data.resultData.length - 1] = String.fromCharCode(lastLetterUTF16 - 1);
      }
    }
  }
}
