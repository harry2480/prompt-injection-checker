import type { ContentSourceGateway } from '../../domain/gateways/content-source.gateway';

/**
 * ContentSourceGateway の Stub 実装。
 * テスト・開発用に、外部 I/O を行わず事前設定した内容を返す。
 */
export class StubContentSourceAdapter implements ContentSourceGateway {
	constructor(
		private readonly fileContent = '',
		private readonly urlContent = '',
		private readonly pdfContent = '',
	) {}

	async readFile(_file: File): Promise<string> {
		return this.fileContent;
	}

	async readPdf(_file: File): Promise<string> {
		return this.pdfContent;
	}

	async fetchUrl(_url: string): Promise<string> {
		return this.urlContent;
	}
}
