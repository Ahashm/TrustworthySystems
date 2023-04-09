import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  alarmOn: boolean = false;
  lockOn: boolean = false;
  alarmName: string = 'Smart Lock System';

  toggleAlarm() {
    this.alarmOn = !this.alarmOn;
    this.lockOn = this.alarmOn;
  }

  getAlarmText() {
    return this.alarmOn ? 'Locked' : 'Unlocked';
  }

  getAlarmColor() {
    return this.alarmOn ? 'red' : 'green';
  }
}
