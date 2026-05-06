export class Event<T, TResult = void> {
  private readonly listeners = new Set<(value: T) => TResult>();

  on(listener: (value: T) => TResult) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(value: T) {
    return [...this.listeners].map((listener) => listener(value));
  }

  clear() {
    this.listeners.clear();
  }
}
