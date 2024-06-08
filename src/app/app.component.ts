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
    const date = localStorage.getItem('date');
    if (date === null || date !== this.getCurrentDateInUTC()) {
      console.log(1);
      this.clearDailyData();
    }
  }

  private getCurrentDateInUTC(): string {
    const currentDate = new Date();
    const offsetInMinutes = currentDate.getTimezoneOffset();
    const utcDate = new Date(currentDate.getTime() - offsetInMinutes * 60 * 1000);

    return utcDate.toISOString().split('T')[0];
  }

  private clearDailyData(): void {
    const itemKeys = ['date', 'citiesChosenWord', 'citiesChosenWordTimestamp',
      'citiesGuesses', 'cities', 'citiesKeyboardKeys', 'citiesIsWin',
      'israeliPremierLeagueChosenWord', 'israeliPremierLeagueChosenWordTimestamp',
      'israeliPremierLeagueGuesses', 'israeliPremierLeague', 'israeliPremierLeagueKeyboardKeys', 'israeliPremierLeagueIsWin'
    ];

    itemKeys.forEach(item => {localStorage.removeItem(item);});
  }
}
