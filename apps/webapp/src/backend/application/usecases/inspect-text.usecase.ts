import type {
	ContentSourceGateway,
	PdfProgressCallback,
} from '../../domain/gateways/content-source.gateway';
import type { DetectionResult } from '../../domain/models/detection-result.model';
import type { InjectionDetectorService } from '../../domain/services/injection-detector.service';

/** 検査対象の入力ソース */
export type InspectionSource =
	| { kind: 'text'; text: string }
	| { kind: 'file'; file: File }
	| { kind: 'url'; url: string };

/** 検査実行時の任意オプション（PDF の抽出進捗を受け取るなど） */
export interface InspectOptions {
	onPdfProgress?: PdfProgressCallback;
}

/**
 * テキスト検査のオーケストレーション UseCase。
 * 入力ソースに応じてテキストを解決し、検知サービスに渡して結果を返す。
 * 外部 I/O は ContentSourceGateway 経由で行い、infrastructure に直接依存しない。
 */
export class InspectTextUseCase {
	constructor(
		private readonly detector: InjectionDetectorService,
		private readonly contentSource: ContentSourceGateway,
	) {}

	/** 入力ソースを検査し、検出結果を返す */
	async execute(source: InspectionSource, options?: InspectOptions): Promise<DetectionResult> {
		const text = await this.resolveText(source, options);
		return this.detector.inspect(text);
	}

	/** 入力ソースから検査対象のテキストを取り出す */
	private async resolveText(source: InspectionSource, options?: InspectOptions): Promise<string> {
		switch (source.kind) {
			case 'text':
				return source.text;
			case 'file':
				return this.isPdf(source.file)
					? this.contentSource.readPdf(source.file, options?.onPdfProgress)
					: this.contentSource.readFile(source.file);
			case 'url':
				return this.contentSource.fetchUrl(source.url);
		}
	}

	/** PDF ファイルかどうかを MIME タイプ・拡張子から判定する */
	private isPdf(file: File): boolean {
		return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
	}
}
