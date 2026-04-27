import { computed, Injectable, signal } from '@angular/core';
import { ToastItem, ToastType } from '../types';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private static nextId = 0;
  private readonly items = signal<ToastItem[]>([]);

  readonly toasts = computed(() => this.items());

  success(message: string, durationMs = 3000): void {
    this.push('success', message, durationMs);
  }

  error(message: string, durationMs = 3000): void {
    this.push('error', message, durationMs);
  }

  warning(message: string, durationMs = 3000): void {
    this.push('warning', message, durationMs);
  }
  
  info(message: string, durationMs = 3000): void {
    this.push('info', message, durationMs);
  }

  private dismiss(id: string): void {
    this.items.update(list => list.filter(item => item.id !== id));
  }

  private push(type: ToastType, message: string, durationMs: number): void {
    const id = `t-${++ToastService.nextId}`;
    this.items.update(list => [...list, { id, type, message, durationMs }]);
    window.setTimeout(() => this.dismiss(id), durationMs);
  }
}
