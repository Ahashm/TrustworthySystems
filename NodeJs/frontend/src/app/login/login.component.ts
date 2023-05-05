import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string | null | undefined;
  myToken: string = '';
  constructor(private router: Router, private http: HttpClient) {}

  onSubmit() {
    const loginData = {
      username: this.username,
      password: this.password,
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(this.username + ':' + this.password),
    });

    this.http
      .post('http://localhost:3002/login', loginData, { headers })
      .subscribe(
        (response: any) => {
          if (response.success) {
            // Redirect to the home page or protected page
            console.log(response.token);
            this.myToken = response.token;
            this.router.navigate(['/home', { token: this.myToken }]);
          } else {
            // Show an error message
            this.errorMessage = response.message;
          }
        },
        (error) => {
          console.error('Error:', error);
          this.errorMessage = 'Wrong username or password. Please try again.';
        }
      );
  }
}

//     this.http
//       .post('http://localhost:3002/api/createuser', loginData, { headers })
//       .subscribe(
//         (response: any) => {
//           if (response.success) {
//             // Redirect to the home page or protected page
//             this.router.navigate(['/home']);
//           } else {
//             // Show an error message
//             this.errorMessage = response.message;
//           }
//         },
//         (error) => {
//           console.error('Error:', error);
//           this.errorMessage = 'Wrong username or password. Please try again.';
//         }
//       );
//   }
// }
