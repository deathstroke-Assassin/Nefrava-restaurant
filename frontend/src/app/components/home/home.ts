import { StoreFooter } from '../store-footer/store-footer';

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { StoreData } from '../../services/store-data';
import { I18nPipe } from '../../services/i18n.pipe';
import { LocalizedText } from '../../services/site-preferences';

interface Category {
  _id: string;
  name: string | LocalizedText;
  description?: string | LocalizedText;
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
  isFeatured?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, StoreFooter, I18nPipe],
  templateUrl: './home.html',
  styleUrl: './nefrava-shell.css'
})
export class Home implements OnInit {
  private readonly categoryPhotoFallbacks: Record<string, string> = {
    '6a4f00000000000000000001': 'photo-1547592180-85f173990554',
    '6a4f00000000000000000002': 'photo-1555939594-58d7cb561ad1',
    '6a4f00000000000000000003': 'photo-1515003197210-e0cd7184f8b5',
    '6a4f00000000000000000004': 'photo-1512621776951-a57141f2eefd',
    '6a4f00000000000000000005': 'photo-1488477181946-6428a0291777',
    '6a4f00000000000000000006': 'photo-1511920170033-f8396924c348'
  };
  categories = signal<Category[]>([]);
  items = signal<Item[]>([]);

  loading = signal(true);
  error = signal('');
  loadingItems = signal(true);
  itemsError = signal('');
  selectedCategory = signal('all');
  contactName = signal('');
  contactEmail = signal('');
  contactMessage = signal('');
  contactBusy = signal(false);
  contactError = signal('');
  contactSuccess = signal('');
  mobileMenuOpen = signal(false);

  constructor(private http: HttpClient, readonly store: StoreData) {}

  toggleFavorite(item: Item): void { this.store.toggleFavorite(item); }
  addToCart(item: Item): void { this.store.addToCart(item); }
  toggleMobileMenu(): void { this.mobileMenuOpen.update(open => !open); }
  closeMobileMenu(): void { this.mobileMenuOpen.set(false); }

  ngOnInit(): void {
    this.loadCategories();
    this.loadItems();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');

    this.http.get<Category[]>('/api/v1.0/categories').subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.error.set(
          'We couldn’t load the categories. Please try again.'
        );
        this.loading.set(false);
      }
    });
  }

  loadItems(): void {
    this.loadingItems.set(true);
    this.itemsError.set('');

    this.http.get<Item[]>('/api/v1.0/items').subscribe({
      next: (items) => {
        console.log('Items API response:', items);

        this.items.set(items.filter(item => item.isActive !== false));

        this.loadingItems.set(false);
      },
      error: (err) => {
        console.error('Failed to load items:', err);
        this.itemsError.set(
          'We couldn’t load the products. Please try again.'
        );
        this.loadingItems.set(false);
      }
    });
  }

  getItemsByCategory(categoryId: string): Item[] {
    return this.items().filter(item => (this.selectedCategory() === 'all' || categoryId === this.selectedCategory()) && (
      item.categoryId === categoryId ||
      item.category?._id === categoryId
    ));
  }

  get featuredItems(): Item[] {
    return this.items().filter(item => item.isFeatured).slice(0, 3);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory.set(categoryId);
  }

  photoUrl(item: Item): string {
    if (item.photo) return `/img/uploades/${encodeURIComponent(item.photo)}`;
    const imageId = this.categoryPhotoFallbacks[item.categoryId] || 'photo-1414235077428-338989a2e8c0';
    return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;
  }

  submitContact(event: Event): void {
    event.preventDefault();
    const name = this.contactName().trim();
    const email = this.contactEmail().trim();
    const message = this.contactMessage().trim();
    this.contactError.set('');
    this.contactSuccess.set('');

    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.contactError.set('Please enter your name, a valid email, and a message.');
      return;
    }

    this.contactBusy.set(true);
    this.http.post('/api/v1.0/contact', { name, email, message }).subscribe({
      next: () => {
        this.contactSuccess.set('Thank you. Your message has been sent.');
        this.contactName.set('');
        this.contactEmail.set('');
        this.contactMessage.set('');
        this.contactBusy.set(false);
      },
      error: err => {
        this.contactError.set(err.error?.message || 'We could not send your message. Please try again later.');
        this.contactBusy.set(false);
      }
    });
  }

  get uncategorizedItems(): Item[] {
    return this.items().filter(item => {
      const itemCategoryId =
        item.categoryId || item.category?._id;

      return !itemCategoryId ||
        !this.categories().some(
          category => category._id === itemCategoryId
        );
    });
  }
}
