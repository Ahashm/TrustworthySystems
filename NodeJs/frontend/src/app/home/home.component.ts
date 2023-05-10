import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  alarmOn = false;
  notificationCount = 3;
  notifications = [
    'Server connection lost',
    'Lock state time exceeded',
    'Server connection lost',
  ];
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

  ngOnInit() {
    this.getLockState();
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
      ? 'http://localhost:3002/lock/close'
      : 'http://localhost:3002/lock/open';
    this.http.post(url, { time, lockId }, { headers }).subscribe((response) => {
      console.log(response);
      console.log(time, lockId);
    });
  }

  getLockState() {
    const lockId = this.thisID;
    const url = 'http://localhost:3002/lock/' + lockId + '/state';
    this.http.get(url).subscribe((response) => {
      const responseObject = JSON.parse(JSON.stringify(response));
      const doorLocked = responseObject.states.doorLocked;
      this.alarmOn = doorLocked;
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
