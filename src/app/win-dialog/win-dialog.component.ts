import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {PlayerDetail} from 'src/app/shared/models/player-detail.model';

@Component({
  templateUrl: './win-dialog.component.html',
  styles: [`.logo-image {width: 200px;}`]
})
export class WinDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public playerDetail: PlayerDetail) {
  }

  ngOnInit() {
    console.log(this.playerDetail);
  }

}
