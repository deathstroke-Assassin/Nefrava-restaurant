import { Routes } from '@angular/router';
import { Dashboard } from './components/dashboard/dashboard';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth-guard';
import { Home } from './components/home/home';
import { Items } from './components/dashboard/items/items';
import { Categories } from './components/dashboard/categories/categories';
import { Orders } from './components/dashboard/orders/orders';
import { ItemDetails } from './pages/item-details/item-details';
import { Favorites } from './pages/favorites/favorites';
import { Cart } from './pages/cart/cart';
import { Buy } from './pages/buy/buy';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
  { path: 'dashboard/items', component: Items, canActivate: [authGuard] },
  { path: 'dashboard/categories', component: Categories, canActivate: [authGuard] },
  { path: 'dashboard/orders', component: Orders, canActivate: [authGuard] },
  { path: 'items/:id', component: ItemDetails },
  { path: 'favorites', component: Favorites },
  { path: 'cart', component: Cart },
  { path: 'buy', component: Buy },
  { path: '**', redirectTo: '' },
];
