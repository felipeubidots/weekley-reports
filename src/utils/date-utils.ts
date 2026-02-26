export class DateUtils {
  static now(): Date {
    return new Date();
  }

  static daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  static daysBetween(from: Date, to: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((to.getTime() - from.getTime()) / msPerDay);
  }

  static isOverdue(dueDate: Date, threshold: number = 0): boolean {
    return dueDate < this.daysAgo(-threshold);
  }

  static daysOverdue(dueDate: Date): number {
    return this.daysBetween(dueDate, this.now());
  }

  static toISODateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  static toLocaleDateString(date: Date): string {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static isInactiveFor(lastActivityDate: Date, days: number): boolean {
    return this.daysBetween(lastActivityDate, this.now()) >= days;
  }

  static inactivityDays(lastActivityDate: Date): number {
    return this.daysBetween(lastActivityDate, this.now());
  }

  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
}
