declare module 'lodash.debounce' {
  const debounce: <T extends (...args: any[]) => any>(
    fn: T,
    wait?: number,
    options?: { leading?: boolean; trailing?: boolean; maxWait?: number },
  ) => T & { cancel: () => void; flush: () => void };
  export default debounce;
}

declare module '@edx/frontend-component-header';
