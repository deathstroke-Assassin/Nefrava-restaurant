import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nPipe } from './services/i18n.pipe';
import { SitePreferences } from './services/site-preferences';

@Component({
  imports: [RouterOutlet, I18nPipe],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly preferences = inject(SitePreferences);
}
