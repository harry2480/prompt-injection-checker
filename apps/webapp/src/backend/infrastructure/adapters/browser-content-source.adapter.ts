import type { ContentSourceGateway } from '../../domain/gateways/content-source.gateway';

/** 検査対象コンテンツの上限（1MB）。過大な入力によるフリーズを防ぐ（ファイル・URL 共通） */
export const MAX_CONTENT_SIZE_BYTES = 1024 * 1024;

const LIMIT_MB = MAX_CONTENT_SIZE_BYTES / (1024 * 1024);

/**
 * ブラウザ I/O を用いた ContentSourceGateway の本番実装。
 * ファイルはローカル（メモリ内）で読み込み、外部に送信しない。
 * URL取得のみ外部通信を行う（CORS 制約の影響を受ける）。
 */
export class BrowserContentSourceAdapter implements ContentSourceGateway {
	async readFile(file: File): Promise<string> {
		if (file.size > MAX_CONTENT_SIZE_BYTES) {
			throw new Error(`ファイルサイズが上限（${LIMIT_MB}MB）を超えています。`);
		}
		return file.text();
	}

	async fetchUrl(url: string): Promise<string> {
		this.assertHttpUrl(url);

		let response: Response;
		try {
			response = await fetch(url, { redirect: 'follow' });
		} catch (cause) {
			throw new Error(
				'URL の取得に失敗しました（URL の誤り・ネットワーク・CORS 制約などの可能性があります）。',
				{ cause },
			);
		}
		if (!response.ok) {
			throw new Error(`URL の取得に失敗しました（HTTP ${response.status}）。`);
		}

		const text = await response.text();
		if (text.length > MAX_CONTENT_SIZE_BYTES) {
			throw new Error(`取得内容が上限（${LIMIT_MB}MB）を超えています。`);
		}
		return text;
	}

	/** http / https の妥当な URL のみ許可する（javascript: 等や相対文字列を弾く） */
	private assertHttpUrl(url: string): void {
		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			throw new Error('URL の形式が正しくありません。');
		}
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			throw new Error('http または https の URL を指定してください。');
		}
	}
}
