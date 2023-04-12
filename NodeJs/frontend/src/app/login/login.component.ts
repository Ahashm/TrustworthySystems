import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    const loginData = {
      username: this.username,
      password: this.password,
    };
    this.http.post('http://localhost:3002/api/login', loginData).subscribe(
      (response: any) => {
        if (response.success) {
          // Redirect to the home page or protected page
          this.router.navigate(['/home']);
        } else {
          // Show an error message
          this.errorMessage = response.message;
        }
      },
      (error) => {
        console.error('Error:', error);
        this.errorMessage =
          'An unexpected error occurred. Please try again later.';
      }
    );
  }
}
