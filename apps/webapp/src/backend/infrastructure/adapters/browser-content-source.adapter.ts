import type { PDFDocumentProxy } from 'pdfjs-dist';
import type {
	ContentSourceGateway,
	PdfProgressCallback,
} from '../../domain/gateways/content-source.gateway';

/** テキストファイル・URL 取得内容の上限（1MB）。過大な入力によるフリーズを防ぐ */
export const MAX_CONTENT_SIZE_BYTES = 1024 * 1024;

/** PDF ファイルの上限（20MB）。画像 PDF はサイズが大きくなりがちなためテキストより緩める */
export const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

/** OCR の暴走を防ぐため検査対象とするページ数の上限 */
export const MAX_PDF_PAGES = 30;

/** テキスト層から抽出したページの文字数がこの値未満なら「画像ページ」とみなし OCR に回す */
const MIN_TEXT_CHARS_PER_PAGE = 8;

/** 抽出テキストの上限（検知エンジンの処理を軽く保つ） */
const MAX_EXTRACTED_TEXT_LENGTH = MAX_CONTENT_SIZE_BYTES;

/** OCR 用にページ画像を描画する際の拡大率（精度確保のため等倍より大きく） */
const OCR_RENDER_SCALE = 2;

const LIMIT_MB = MAX_CONTENT_SIZE_BYTES / (1024 * 1024);
const PDF_LIMIT_MB = MAX_PDF_SIZE_BYTES / (1024 * 1024);

/**
 * ブラウザ I/O を用いた ContentSourceGateway の本番実装。
 * ファイル・PDF はローカル（メモリ内）で読み込み、外部に送信しない。
 * PDF の OCR モデルのみ CDN から取得するが、入力（PDF の中身）は外部送信しない。
 * URL取得のみ外部通信を行う（CORS 制約の影響を受ける）。
 */
export class BrowserContentSourceAdapter implements ContentSourceGateway {
	async readFile(file: File): Promise<string> {
		if (file.size > MAX_CONTENT_SIZE_BYTES) {
			throw new Error(`ファイルサイズが上限（${LIMIT_MB}MB）を超えています。`);
		}
		return file.text();
	}

	async readPdf(file: File, onProgress?: PdfProgressCallback): Promise<string> {
		if (file.size > MAX_PDF_SIZE_BYTES) {
			throw new Error(`PDF のサイズが上限（${PDF_LIMIT_MB}MB）を超えています。`);
		}

		// pdfjs は window / Worker に依存するため、静的エクスポートのビルドを壊さないよう遅延読込する
		const pdfjs = await import('pdfjs-dist');
		pdfjs.GlobalWorkerOptions.workerSrc = new URL(
			'pdfjs-dist/build/pdf.worker.min.mjs',
			import.meta.url,
		).toString();

		const data = new Uint8Array(await file.arrayBuffer());
		const loadingTask = pdfjs.getDocument({ data });
		let doc: PDFDocumentProxy;
		try {
			doc = await loadingTask.promise;
		} catch (cause) {
			throw new Error('PDF を読み込めませんでした（破損・非対応形式の可能性があります）。', {
				cause,
			});
		}

		try {
			const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
			const pageTexts: string[] = new Array(pageCount).fill('');
			const imagePages: number[] = [];

			// テキスト層の抽出（文字を選択できる PDF はこれで完結する）
			for (let pageNo = 1; pageNo <= pageCount; pageNo++) {
				onProgress?.({
					phase: 'parse',
					message: `PDF のテキストを解析中… (${pageNo}/${pageCount} ページ)`,
					ratio: pageNo / pageCount,
				});
				const page = await doc.getPage(pageNo);
				try {
					const content = await page.getTextContent();
					const text = content.items
						.map((item) => ('str' in item ? item.str : ''))
						.join(' ')
						.replace(/[ \t]+/g, ' ')
						.trim();
					pageTexts[pageNo - 1] = text;
					if (text.replace(/\s/g, '').length < MIN_TEXT_CHARS_PER_PAGE) {
						imagePages.push(pageNo);
					}
				} finally {
					page.cleanup();
				}
			}

			// 文字を選択できない（テキスト層が無い）ページはブラウザ内 OCR で読み取る
			if (imagePages.length > 0) {
				await this.ocrImagePages(doc, pageTexts, imagePages, onProgress);
			}

			let combined = pageTexts
				.map((t) => t.trim())
				.filter(Boolean)
				.join('\n\n');
			if (doc.numPages > MAX_PDF_PAGES) {
				combined += `\n\n[注: ページ数が多いため先頭 ${MAX_PDF_PAGES} ページのみを検査しました]`;
			}
			return combined.length > MAX_EXTRACTED_TEXT_LENGTH
				? combined.slice(0, MAX_EXTRACTED_TEXT_LENGTH)
				: combined;
		} finally {
			await loadingTask.destroy();
		}
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

	/**
	 * テキスト層を持たない画像ページを OCR で読み取り、pageTexts を上書きする。
	 * tesseract.js（日本語＋英語）を用い、モデルは CDN から取得する（入力は送信しない）。
	 */
	private async ocrImagePages(
		doc: PDFDocumentProxy,
		pageTexts: string[],
		imagePages: number[],
		onProgress?: PdfProgressCallback,
	): Promise<void> {
		onProgress?.({
			phase: 'ocr',
			message: '画像 PDF を検出しました。OCR で読み取ります（初回はモデルを取得します）…',
		});

		const { createWorker } = await import('tesseract.js');
		let worker: Awaited<ReturnType<typeof createWorker>>;
		try {
			// OCR モデル（日本語＋英語）を CDN から取得する。入力（PDF）は送信しない
			worker = await createWorker(['jpn', 'eng']);
		} catch (cause) {
			throw new Error(
				'OCR モデルの取得に失敗しました（画像 PDF の読み取りにはネットワーク接続が必要です）。',
				{ cause },
			);
		}
		try {
			for (const [done, pageNo] of imagePages.entries()) {
				onProgress?.({
					phase: 'ocr',
					message: `OCR で読み取り中… (${done + 1}/${imagePages.length} ページ)`,
					ratio: done / imagePages.length,
				});
				const page = await doc.getPage(pageNo);
				const canvas = this.renderPageToCanvas(page);
				try {
					await page.render({ canvas, viewport: page.getViewport({ scale: OCR_RENDER_SCALE }) })
						.promise;
					const { data } = await worker.recognize(canvas);
					pageTexts[pageNo - 1] = data.text.trim();
				} finally {
					// メモリ解放（画像 PDF はキャンバスが大きくなりがち）
					canvas.width = 0;
					canvas.height = 0;
					page.cleanup();
				}
			}
		} finally {
			await worker.terminate();
		}
	}

	/** OCR 用に PDF ページを描画する空のキャンバスを用意する */
	private renderPageToCanvas(page: {
		getViewport: (params: { scale: number }) => { width: number; height: number };
	}): HTMLCanvasElement {
		const viewport = page.getViewport({ scale: OCR_RENDER_SCALE });
		const canvas = document.createElement('canvas');
		canvas.width = Math.ceil(viewport.width);
		canvas.height = Math.ceil(viewport.height);
		return canvas;
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
