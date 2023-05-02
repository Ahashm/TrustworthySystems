import { Component } from '@angular/core';
import { ConnectionService } from '../connection.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  alarmOn: boolean = false;
  lockOn: boolean = false;
  alarmName: string = 'Smart Lock System';
  notificationCount: number = 0;
  showNotification: boolean = false;
  showPopup: boolean = false;
  notifications: string[] = [];

  constructor(private connection: ConnectionService) {}

  ngOnInit() {
    this.connection.getData().subscribe((data) => {
      console.log(data);
    });
  }

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

  onNotificationClick() {
    this.showPopup = !this.showPopup;
    this.resetNotificationCount();
  }

  increaseNotificationCount() {
    this.notificationCount++;
    const now = new Date();
    const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    this.notifications.push(`Error at ${timestamp}`);
  }

  resetNotificationCount() {
    this.notificationCount = 0;
  }

  toggleNotification() {
    this.showNotification = !this.showNotification;
    this.resetNotificationCount();
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  closePopup() {
    this.showPopup = false;
  }
}
