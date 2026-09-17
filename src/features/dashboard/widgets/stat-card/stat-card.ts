import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  imports: [RouterLink, MatIconModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  readonly label = input('');
  readonly value = input<string | number>('—');
  readonly icon = input('insights');
  readonly hint = input<string | null>(null);
  readonly tone = input<'blue' | 'green' | 'amber' | 'red' | 'violet'>('blue');
  readonly link = input<string | null>(null);
}
