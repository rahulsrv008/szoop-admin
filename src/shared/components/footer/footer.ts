import { Component } from '@angular/core';
import { ENVIRONMENT } from '@config/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly appName = ENVIRONMENT.appName;
  readonly year = new Date().getFullYear();
  readonly apiBaseUrl = ENVIRONMENT.apiBaseUrl;
}
