import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  alarmOn = false;
  notificationCount = 3;
  notifications = ['Notification 1', 'Notification 2', 'Notification 3'];
  showNotification = false;
  historyLog: { date: Date; event: string }[] = [];

  toggleAlarm() {
    this.alarmOn = !this.alarmOn;
    const event = this.alarmOn ? 'Alarm turned on' : 'Alarm turned off';
    this.addLogEntry(event);
  }

  getAlarmText() {
    return this.alarmOn ? 'The alarm is on' : 'The alarm is off';
  }

  addNotification() {
    this.notificationCount++;
    this.notifications.push('Notification ' + this.notificationCount);
    const event = `New notification added: Notification ${this.notificationCount}`;
    this.addLogEntry(event);
  }

  toggleNotificationList() {
    this.showNotification = !this.showNotification;
  }

  addLogEntry(event: string) {
    this.historyLog.push({
      date: new Date(),
      event: event,
    });
  }
}
