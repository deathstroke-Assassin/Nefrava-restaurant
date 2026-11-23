import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nPipe } from '../../../services/i18n.pipe';
import { LocalizedText, SitePreferences } from '../../../services/site-preferences';

interface Category { _id: string; name: string | LocalizedText; description?: string | LocalizedText; }
interface Item {
  _id: string; name: string | LocalizedText; description: string | LocalizedText; price: number;
  categoryId: string; category?: Category; isActive: boolean; isAvailable: boolean; isFeatured: boolean; photo?: string;
}
interface ItemForm {
  nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; price: number;
  categoryId: string; isActive: boolean; isAvailable: boolean; isFeatured: boolean;
}

@Component({
  selector: 'app-items',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, I18nPipe],
  templateUrl: './items.html',
  styleUrl: './items.css'
})
export class Items implements OnInit {
  private readonly api = '/api/v1.0';
  readonly preferences = inject(SitePreferences);
  readonly items = signal<Item[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly search = signal('');
  readonly filteredItems = computed(() => {
    const term = this.search().trim().toLowerCase();
    return term ? this.items().filter(item =>
      this.searchable(item.name).includes(term) ||
      this.searchable(item.category?.name).includes(term) ||
      this.searchable(item.description).includes(term)
    ) : this.items();
  });
  readonly activeCount = computed(() => this.items().filter(item => item.isActive).length);
  readonly availableCount = computed(() => this.items().filter(item => item.isAvailable !== false).length);
  readonly featuredCount = computed(() => this.items().filter(item => item.isFeatured).length);

  showForm = false;
  editingId: string | null = null;
  selectedPhoto: File | null = null;
  photoInputKey = 0;
  form: ItemForm = this.emptyForm();

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.loadCategories(); this.loadItems(); }

  private emptyForm(): ItemForm {
    return { nameEn: '', nameAr: '', descriptionEn: '', descriptionAr: '', price: 1, categoryId: '', isActive: true, isAvailable: true, isFeatured: false };
  }

  private textValues(value: string | LocalizedText | undefined): { en: string; ar: string } {
    if (typeof value === 'string') return { en: value, ar: '' };
    return { en: value?.en || '', ar: value?.ar || '' };
  }

  private searchable(value: string | LocalizedText | undefined): string {
    const text = this.textValues(value);
    return `${text.en} ${text.ar}`.toLowerCase();
  }

  loadItems(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<Item[]>(this.api + '/manager/items').subscribe({
      next: items => { this.items.set(items); this.loading.set(false); },
      error: err => {
        this.error.set(err.error?.message || 'Could not load items.');
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.http.get<Category[]>(this.api + '/categories').subscribe({
      next: categories => this.categories.set(categories),
      error: err => this.error.set(err.error?.message || 'Could not load categories.')
    });
  }

  openCreate(): void {
    this.editingId = null; this.form = this.emptyForm(); this.selectedPhoto = null;
    this.photoInputKey++; this.error.set(''); this.success.set(''); this.showForm = true;
  }

  openEdit(item: Item): void {
    this.editingId = item._id;
    const name = this.textValues(item.name);
    const description = this.textValues(item.description);
    this.form = {
      nameEn: name.en, nameAr: name.ar,
      descriptionEn: description.en, descriptionAr: description.ar,
      price: item.price,
      categoryId: item.categoryId, isActive: item.isActive, isAvailable: item.isAvailable !== false, isFeatured: item.isFeatured === true
    };
    this.selectedPhoto = null; this.photoInputKey++;
    this.error.set(''); this.success.set(''); this.showForm = true;
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedPhoto = input.files?.[0] || null;
  }

  closeForm(): void { if (!this.saving()) this.showForm = false; }

  saveItem(): void {
    if (!this.form.nameEn.trim() || !this.form.nameAr.trim() || !this.form.categoryId || this.form.price <= 0) {
      this.error.set('Enter an English and Arabic name, category, and price greater than zero.');
      return;
    }

    this.saving.set(true); this.error.set(''); this.success.set('');
    const payload = new FormData();
    payload.append('name', JSON.stringify({ en: this.form.nameEn.trim(), ar: this.form.nameAr.trim() }));
    payload.append('description', JSON.stringify({ en: this.form.descriptionEn.trim(), ar: this.form.descriptionAr.trim() }));
    payload.append('price', String(this.form.price));
    payload.append('categoryId', this.form.categoryId);
    payload.append('isActive', String(this.form.isActive));
    payload.append('isAvailable', String(this.form.isAvailable));
    payload.append('isFeatured', String(this.form.isFeatured));
    if (this.selectedPhoto) payload.append('photo', this.selectedPhoto);

    const editing = !!this.editingId;
    const request = this.editingId
      ? this.http.put(this.api + '/items/' + this.editingId, payload)
      : this.http.post(this.api + '/items', payload);
    request.subscribe({
      next: () => {
        this.saving.set(false); this.showForm = false;
        this.success.set(editing ? 'Item updated successfully.' : 'Item created successfully.');
        this.loadItems();
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Could not save the item.');
      }
    });
  }

  trackById(_index: number, item: Item): string { return item._id; }

  deleteItem(item: Item): void {
    if (!window.confirm('Delete "' + this.preferences.translate(item.name) + '"? This action cannot be undone.')) return;
    this.error.set(''); this.success.set('');
    this.http.delete(this.api + '/items/' + item._id).subscribe({
      next: () => { this.success.set('"' + this.preferences.translate(item.name) + '" was deleted.'); this.loadItems(); },
      error: err => this.error.set(err.error?.message || 'Could not delete the item.')
    });
  }
}
