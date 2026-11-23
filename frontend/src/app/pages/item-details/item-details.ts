import { StoreFooter } from '../../components/store-footer/store-footer';

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { StoreData } from '../../services/store-data';
import { I18nPipe } from '../../services/i18n.pipe';
import { LocalizedText } from '../../services/site-preferences';

interface Category {
  _id: string;
  name: string | LocalizedText;
}

interface Item {
  _id: string;
  name: string | LocalizedText;
  description: string | LocalizedText;
  price: number;
  photo?: string;
  categoryId: string;
  category?: Category;
  isActive?: boolean;
  isAvailable?: boolean;
}

@Component({
  selector: 'app-item-details',
  standalone: true,
  imports: [CommonModule, RouterLink, StoreFooter, I18nPipe],
  templateUrl: './item-details.html',
  styleUrl: './item-details.css'
})
export class ItemDetails implements OnInit {
  item = signal<Item | null>(null);
  loading = signal(true);
  error = signal('');

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    readonly store: StoreData
  ) {}

  toggleFavorite(item: Item): void { this.store.toggleFavorite(item); }
  addToCart(item: Item): void { if (item.isAvailable !== false) this.store.addToCart(item); }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Invalid item ID.');
      this.loading.set(false);
      return;
    }

    this.loadItem(id);
  }

  loadItem(id: string): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<Item>(`/api/v1.0/items/${id}`).subscribe({
      next: (item) => {
        if (!item || item.isActive === false) {
          this.error.set('This item is unavailable.');
        } else {
          this.item.set(item);
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load item:', err);
        this.error.set(
          err.status === 404
            ? 'Item not found.'
            : 'We couldn’t load this item. Please try again.'
        );
        this.loading.set(false);
      }
    });
  }

  get photoUrl(): string {
    const item = this.item();
    if (item?.photo) return `/img/uploades/${encodeURIComponent(item.photo)}`;
    if (!item) return '';
    const fallbacks: Record<string, string> = {
      '6a4f00000000000000000001': 'photo-1547592180-85f173990554',
      '6a4f00000000000000000002': 'photo-1555939594-58d7cb561ad1',
      '6a4f00000000000000000003': 'photo-1515003197210-e0cd7184f8b5',
      '6a4f00000000000000000004': 'photo-1512621776951-a57141f2eefd',
      '6a4f00000000000000000005': 'photo-1488477181946-6428a0291777',
      '6a4f00000000000000000006': 'photo-1511920170033-f8396924c348'
    };
    const imageId = fallbacks[item.categoryId] || 'photo-1414235077428-338989a2e8c0';
    return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=1100&q=85`;
  }

}
