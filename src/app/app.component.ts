import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Data} from '@angular/router';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
  }
}
