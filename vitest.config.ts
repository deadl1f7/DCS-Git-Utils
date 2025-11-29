// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Basic settings
        globals: true, // allows using describe/it without importing them
        environment: 'node',
    },
});