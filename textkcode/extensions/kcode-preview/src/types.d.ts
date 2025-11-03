declare function acquireVsCodeApi(): {
  postMessage(message: unknown): void;
  setState<T>(state: T): void;
  getState<T>(): T;
};
