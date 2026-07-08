import {
	BrowserContentSourceAdapter,
	MAX_CONTENT_SIZE_BYTES,
} from '@/backend/infrastructure/adapters/browser-content-source.adapter';
import { afterEach, describe, expect, it, vi } from 'vitest';

const adapter = new BrowserContentSourceAdapter();

describe('BrowserContentSourceAdapter.readFile', () => {
	it('上限以内のファイルは内容を返す', async () => {
		const file = {
			size: 10,
			text: async () => 'hello world',
		} as unknown as File;
		await expect(adapter.readFile(file)).resolves.toBe('hello world');
	});

	it('上限を超えるファイルは例外を投げる', async () => {
		const file = {
			size: MAX_CONTENT_SIZE_BYTES + 1,
			text: async () => '',
		} as unknown as File;
		await expect(adapter.readFile(file)).rejects.toThrow(/上限/);
	});
});

describe('BrowserContentSourceAdapter.fetchUrl', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('成功時は本文テキストを返す', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => 'page body' }),
		);
		await expect(adapter.fetchUrl('https://example.com')).resolves.toBe('page body');
	});

	it('HTTP エラー時は例外を投げる', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: false, status: 404, text: async () => '' }),
		);
		await expect(adapter.fetchUrl('https://example.com')).rejects.toThrow(/404/);
	});

	it('通信失敗時は分かりやすい例外を投げる', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
		await expect(adapter.fetchUrl('https://example.com')).rejects.toThrow(/取得に失敗/);
	});

	it('取得内容が上限を超える場合は例外を投げる', async () => {
		const huge = 'a'.repeat(MAX_CONTENT_SIZE_BYTES + 1);
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => huge }),
		);
		await expect(adapter.fetchUrl('https://example.com')).rejects.toThrow(/上限/);
	});

	it('http/https でない URL は fetch せず例外を投げる', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		await expect(adapter.fetchUrl('javascript:alert(1)')).rejects.toThrow(/http/);
		await expect(adapter.fetchUrl('not a url')).rejects.toThrow(/形式/);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
