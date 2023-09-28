import {Component, OnInit} from '@angular/core';
import {refreshAfter1Hour} from 'src/app/shared/consts/is-refresh.const';
declare const swal: any;



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor() {
  }

  ngOnInit() {
    refreshAfter1Hour();
    const isWin = JSON.parse(localStorage.getItem('isWin') || '[]');
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
    })

  }
}
