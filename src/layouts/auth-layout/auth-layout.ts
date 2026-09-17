import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ENVIRONMENT } from '@config/environment';

/** Centered shell for login / password screens. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, MatIconModule],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {
  readonly appName = ENVIRONMENT.appName;
}
