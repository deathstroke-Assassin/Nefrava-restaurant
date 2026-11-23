import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nPipe } from '../../services/i18n.pipe';

@Component({
  selector: 'app-store-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, I18nPipe],
  templateUrl: './store-footer.html',
  styleUrl: './store-footer.css'
})
export class StoreFooter {
  readonly year = new Date().getFullYear();
}
