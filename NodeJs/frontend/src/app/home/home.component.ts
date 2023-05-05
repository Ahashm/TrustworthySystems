import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { response } from 'express';
import { ActivatedRoute } from '@angular/router';

export class QuickTest {
  time: Date;
  lockId: string;
  constructor(lockId: string) {
    this.lockId = lockId;
    this.time = new Date();
  }
}

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
  historyLog: { date: Date; event: string; id: string }[] = [];
  quickTest: QuickTest[] = [];
  thisID: string = '44215962539792';
  token: string = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  toggleAlarm() {
    console.log(this.token);
    this.alarmOn = !this.alarmOn;
    const event = this.alarmOn ? 'Alarm turned on' : 'Alarm turned off';
    this.addLogEntry(event);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.token,
    });

    const quickTestInstance = new QuickTest('321');
    this.quickTest.push(quickTestInstance);
    //http req

    const url = this.alarmOn
      ? 'http://localhost:3002/lock/open'
      : 'http://localhost:3002/lock/close';
    this.http.post(url, this.quickTest, { headers }).subscribe((response) => {
      console.log(this.quickTest);
      console.log(
        'Lock ' + (this.alarmOn ? 'opened' : 'closed') + ' successfully.'
      );
    });
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
      id: this.thisID,
    });
  }
}
