import { Injectable, computed, signal } from '@angular/core';
import { LocalizedText } from './site-preferences';

export interface StoreItem {
  _id: string;
  name: string | LocalizedText;
  description: string | LocalizedText;
  price: number;
  photo?: string;
  categoryId?: string;
  category?: { _id: string; name: string | LocalizedText };
}

export interface CartLine extends StoreItem {
  quantity: number;
}

const FAVORITES_KEY = 'nefrava-favorites';
const CART_KEY = 'nefrava-cart';

function readStored<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T[] : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class StoreData {
  private readonly categoryPhotoFallbacks: Record<string, string> = {
    '6a4f00000000000000000001': 'photo-1547592180-85f173990554',
    '6a4f00000000000000000002': 'photo-1555939594-58d7cb561ad1',
    '6a4f00000000000000000003': 'photo-1515003197210-e0cd7184f8b5',
    '6a4f00000000000000000004': 'photo-1512621776951-a57141f2eefd',
    '6a4f00000000000000000005': 'photo-1488477181946-6428a0291777',
    '6a4f00000000000000000006': 'photo-1511920170033-f8396924c348'
  };

  readonly favorites = signal<StoreItem[]>(readStored<StoreItem>(FAVORITES_KEY));
  readonly cart = signal<CartLine[]>(readStored<CartLine>(CART_KEY));
  readonly cartCount = computed(() =>
    this.cart().reduce((total, line) => total + line.quantity, 0)
  );
  readonly cartTotal = computed(() =>
    this.cart().reduce((total, line) => total + line.price * line.quantity, 0)
  );

  isFavorite(id: string): boolean {
    return this.favorites().some(item => item._id === id);
  }

  photoUrl(item: StoreItem): string {
    if (item.photo) return `/img/uploades/${encodeURIComponent(item.photo)}`;
    const imageId = this.categoryPhotoFallbacks[item.categoryId || ''] || 'photo-1414235077428-338989a2e8c0';
    return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;
  }

  toggleFavorite(item: StoreItem): void {
    const favorites = this.isFavorite(item._id)
      ? this.favorites().filter(saved => saved._id !== item._id)
      : [...this.favorites(), item];
    this.favorites.set(favorites);
    this.persist(FAVORITES_KEY, favorites);
  }

  removeFavorite(id: string): void {
    const favorites = this.favorites().filter(item => item._id !== id);
    this.favorites.set(favorites);
    this.persist(FAVORITES_KEY, favorites);
  }

  addToCart(item: StoreItem, quantity = 1): void {
    const cart = [...this.cart()];
    const existing = cart.find(line => line._id === item._id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...item, quantity });
    }
    this.cart.set(cart);
    this.persist(CART_KEY, cart);
  }

  setQuantity(id: string, quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    const cart = this.cart().map(line =>
      line._id === id ? { ...line, quantity } : line
    );
    this.cart.set(cart);
    this.persist(CART_KEY, cart);
  }

  removeFromCart(id: string): void {
    const cart = this.cart().filter(line => line._id !== id);
    this.cart.set(cart);
    this.persist(CART_KEY, cart);
  }

  clearCart(): void {
    this.cart.set([]);
    this.persist(CART_KEY, []);
  }

  private persist(key: string, value: unknown[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The current session remains usable if browser storage is unavailable.
    }
  }
}
