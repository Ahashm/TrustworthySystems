import { Component } from '@angular/core';
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

  constructor(private router: Router) {}

  onSubmit() {
    // Check if the username and password are correct
    if (this.username === 'myusername' && this.password === 'mypassword') {
      this.errorMessage = null;
      // Navigate to the home page component
      this.router.navigate(['/home']);
    } else {
      // Display an error message to the user
      this.errorMessage = 'Invalid username or password';
    }
  }
}
