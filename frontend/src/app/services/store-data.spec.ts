import { TestBed } from '@angular/core/testing';
import { StoreData, StoreItem } from './store-data';

describe('StoreData', () => {
  let store: StoreData;

  const item: StoreItem = {
    _id: 'item-1',
    name: 'Nefrava Koshari',
    description: 'Rice, lentils, pasta, and our slow-simmered tomato sauce.',
    price: 120
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [StoreData] });
    store = TestBed.inject(StoreData);
  });

  afterEach(() => localStorage.clear());

  it('starts with empty favorites and cart', () => {
    expect(store.favorites()).toEqual([]);
    expect(store.cart()).toEqual([]);
    expect(store.cartCount()).toBe(0);
    expect(store.cartTotal()).toBe(0);
  });

  it('adds and removes a favorite and saves it to local storage', () => {
    store.toggleFavorite(item);

    expect(store.isFavorite(item._id)).toBe(true);
    expect(JSON.parse(localStorage.getItem('nefrava-favorites') || '[]'))
      .toEqual([item]);

    store.toggleFavorite(item);

    expect(store.isFavorite(item._id)).toBe(false);
    expect(JSON.parse(localStorage.getItem('nefrava-favorites') || '[]'))
      .toEqual([]);
  });

  it('adds cart items, combines duplicate items, and computes totals', () => {
    store.addToCart(item);
    store.addToCart(item, 2);

    expect(store.cart()).toEqual([{ ...item, quantity: 3 }]);
    expect(store.cartCount()).toBe(3);
    expect(store.cartTotal()).toBe(360);
    expect(JSON.parse(localStorage.getItem('nefrava-cart') || '[]'))
      .toEqual([{ ...item, quantity: 3 }]);
  });

  it('updates quantity and ignores invalid quantities', () => {
    store.addToCart(item);
    store.setQuantity(item._id, 4);
    store.setQuantity(item._id, 0);
    store.setQuantity(item._id, 1.5);

    expect(store.cart()[0].quantity).toBe(4);
    expect(store.cartCount()).toBe(4);
    expect(store.cartTotal()).toBe(480);
  });

  it('removes cart items and clears the cart', () => {
    store.addToCart(item);
    store.removeFromCart(item._id);
    expect(store.cart()).toEqual([]);

    store.addToCart(item);
    store.clearCart();

    expect(store.cart()).toEqual([]);
    expect(JSON.parse(localStorage.getItem('nefrava-cart') || '[]'))
      .toEqual([]);
  });
});
