import {Component, OnInit} from '@angular/core';
declare const swal: any;



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor() {
  }

  ngOnInit() {
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
