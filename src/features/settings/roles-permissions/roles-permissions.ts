import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  PERMISSION_CATALOGUE,
  ROLE_CATALOGUE,
} from '../settings.model';

@Component({
  selector: 'app-roles-permissions',
  imports: [RouterLink, RouterLinkActive, MatButtonModule],
  templateUrl: './roles-permissions.html',
  styleUrl: './roles-permissions.scss',
})
export class RolesPermissions {
  readonly roles = ROLE_CATALOGUE;
  readonly permissions = PERMISSION_CATALOGUE;
}
