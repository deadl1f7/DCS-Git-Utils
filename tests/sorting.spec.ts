import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { saveConfig } from '../src/config'; // Assume you exported this
import { jsonSort } from '../src/sorting';

describe('Sorting', () => {
    const filepath = "./test.json";

    beforeEach(() => {
        vi.clearAllMocks(); // Reset counters before each test
    });
    afterAll(async () => {
        await fs.rm(filepath);
    })
    it('should write sort JSON keys', async () => {
        // 2. Run your function

        const testData = JSON.stringify({ key: "test", asdf: "test2" });
        await fs.writeFile(filepath, testData, 'utf-8');
        await jsonSort(filepath);
        const sorted = await fs.readFile(filepath, { encoding: 'utf-8' });
        expect(sorted.indexOf("asdf") > sorted.indexOf("key"));

    });
});