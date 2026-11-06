import { createWithEqualityFn } from 'zustand/traditional';

/** React 19 requires a cached getSnapshot; the default zustand create inlines selectors. */
export const create = createWithEqualityFn;
