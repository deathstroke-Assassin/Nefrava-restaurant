
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18nPipe } from '../../../services/i18n.pipe';
import { LocalizedText, SitePreferences } from '../../../services/site-preferences';

interface Category {
  _id: string;
  name: string | LocalizedText;
  description: string | LocalizedText;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, I18nPipe],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {
  private readonly api = '/api/v1.0/categories';
  readonly preferences = inject(SitePreferences);

  categories: Category[] = [];
  
  saving = false;
  error = signal('');
  loading = signal(true);
  success = '';
  search = '';

  showForm = false;
  editingId: string | null = null;

  form = this.emptyForm();

  constructor(
    private http: HttpClient,
    
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private emptyForm() {
    return {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: ''
    };
  }

  private textValues(value: string | LocalizedText | undefined): { en: string; ar: string } {
    if (typeof value === 'string') return { en: value, ar: '' };
    return { en: value?.en || '', ar: value?.ar || '' };
  }

  private searchable(value: string | LocalizedText | undefined): string {
    const text = this.textValues(value);
    return `${text.en} ${text.ar}`.toLowerCase();
  }

  get filteredCategories(): Category[] {
    const term = this.search.trim().toLowerCase();

    if (!term) return this.categories;

    return this.categories.filter(category =>
      this.searchable(category.name).includes(term) ||
      this.searchable(category.description).includes(term)
    );
  }

  loadCategories(): void {
    this.loading.set(true)
    this.error.set('');

    this.http.get<Category[]>(this.api).subscribe({
      next: categories => {
        this.categories = categories;
        this.loading.set(false)
      },
      error: err => {
        this.error.set(err.error?.message || 'Could not load categories.');
        this.loading.set(false)
        
      }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.error.set('');
    this.success = '';
    this.showForm = true;
  }

  openEdit(category: Category): void {
    this.editingId = category._id;
    const name = this.textValues(category.name);
    const description = this.textValues(category.description);
    this.form = {
      nameEn: name.en,
      nameAr: name.ar,
      descriptionEn: description.en,
      descriptionAr: description.ar
    };
    this.error.set('');
    this.success = '';
    this.showForm = true;
  }

  closeForm(): void {
    if (this.saving) return;
    this.showForm = false;
  }

  saveCategory(): void {
    if (!this.form.nameEn.trim() || !this.form.nameAr.trim()) {
      this.error.set('Category names are required in English and Arabic.');
      return;
    }

    this.saving = true;
    this.error.set('');
    this.success = '';

    const payload = {
      name: { en: this.form.nameEn.trim(), ar: this.form.nameAr.trim() },
      description: {
        en: this.form.descriptionEn.trim(),
        ar: this.form.descriptionAr.trim()
      }
    };

    const request = this.editingId
      ? this.http.put(`${this.api}/${this.editingId}`, payload)
      : this.http.post(this.api, payload);

    const wasEditing = !!this.editingId;

    request.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.success = wasEditing
          ? 'Category updated successfully.'
          : 'Category created successfully.';
        this.loadCategories();
      },
      error: err => {
        this.saving = false;
        this.error.set(err.error?.message || 'Could not save the category.');
      }
    });
  }

  deleteCategory(category: Category): void {
    const confirmed = window.confirm(
      `Delete "${this.preferences.translate(category.name)}"? Items may still reference this category.`
    );

    if (!confirmed) return;

    this.error.set('');
    this.success = '';

    this.http.delete(`${this.api}/${category._id}`).subscribe({
      next: () => {
        this.success = `"${this.preferences.translate(category.name)}" was deleted.`;
        this.loadCategories();
      },
      error: err => {
        this.error.set(err.error?.message || 'Could not delete the category.');
      }
    });
  }

  trackById(_index: number, category: Category): string {
    return category._id;
  }
}
