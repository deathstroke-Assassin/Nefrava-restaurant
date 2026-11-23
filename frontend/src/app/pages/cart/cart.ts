import { StoreFooter } from '../../components/store-footer/store-footer';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StoreData } from '../../services/store-data';
import { I18nPipe } from '../../services/i18n.pipe';

@Component({selector:'app-cart',standalone:true,imports: [CommonModule,FormsModule,RouterLink, StoreFooter, I18nPipe],templateUrl:'./cart.html',styleUrl:'./cart.css'})
export class Cart {
  readonly store = inject(StoreData);
  changeQuantity(id: string, value: string): void { this.store.setQuantity(id, Number(value)); }
}
