import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocalizedText, SitePreferences } from './site-preferences';

@Pipe({ name: 'i18n', standalone: true, pure: false })
export class I18nPipe implements PipeTransform {
  private readonly preferences = inject(SitePreferences);

  transform(value: string | LocalizedText | null | undefined): string {
    return this.preferences.translate(value);
  }
}
