import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';

@Component({
  templateUrl: './win-dialog.component.html',
  styleUrls: ['./win-dialog.component.scss']
})
export class WinDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public playerDetail: PlayerDetail) {
  }
}
