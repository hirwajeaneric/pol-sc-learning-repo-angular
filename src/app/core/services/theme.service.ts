import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AppTheme } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'polaris-theme';
  private readonly currentTheme = signal<AppTheme>('light');

  readonly theme = computed(() => this.currentTheme());

  constructor() {
    this.initializeTheme();
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme() === 'light' ? 'dark' : 'light');
  }

  private setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.storageKey, theme);
    this.document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private initializeTheme(): void {
    const stored = localStorage.getItem(this.storageKey) as AppTheme | null;
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const preferred = media?.matches ? 'dark' : 'light';
    this.setTheme(stored || preferred);
  }
}
