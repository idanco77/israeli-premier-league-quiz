import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';

@Component({
  templateUrl: './results-dialog.component.html',
  styleUrls: ['./results-dialog.component.scss']
})
export class ResultsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: {playerDetails: PlayerDetail, message: string}) {
  }
}
