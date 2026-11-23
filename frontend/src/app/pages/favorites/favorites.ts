import { StoreFooter } from '../../components/store-footer/store-footer';
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreData } from '../../services/store-data';
import { I18nPipe } from '../../services/i18n.pipe';

@Component({selector:'app-favorites',standalone:true,imports: [CommonModule,RouterLink, StoreFooter, I18nPipe],templateUrl:'./favorites.html',styleUrl:'./favorites.css'})
export class Favorites { readonly store = inject(StoreData); }
