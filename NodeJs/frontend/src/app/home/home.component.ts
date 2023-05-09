import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  alarmOn = false;
  notificationCount = 3;
  notifications = ['Notification 1', 'Notification 2', 'Notification 3'];
  showNotification = true;
  historyLog: { date: Date; event: string; id: string }[] = [];
  thisID: string = '44215962539792';
  token: string = '';
  showMenu = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  toggleAlarm() {
    console.log(this.token);
    this.alarmOn = !this.alarmOn;
    const event = this.alarmOn ? 'Door is locked' : 'Door is open';
    this.addLogEntry(event);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.token,
    });

    const time = new Date();
    const lockId = this.thisID;

    //http req

    const url = this.alarmOn
      ? 'http://localhost:3002/lock/open'
      : 'http://localhost:3002/lock/close';
    this.http.post(url, { time, lockId }, { headers }).subscribe((response) => {
      console.log(time, lockId);
      console.log(
        'Lock ' + (this.alarmOn ? 'opened' : 'closed') + ' successfully.'
      );
    });
  }

  getAlarmText() {
    return this.alarmOn ? 'Door is locked' : 'Door is open';
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

  logout() {
    this.router.navigate(['']);
  }
}
