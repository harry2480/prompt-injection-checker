/**
 * PDF 抽出の進捗通知。OCR はモデルダウンロード＋ページごとの処理で時間がかかるため、
 * UI に途中経過を伝えるための任意コールバック（副作用は UI 側に閉じる）。
 */
export type PdfProgressCallback = (progress: PdfProgress) => void;

export interface PdfProgress {
	/** 処理フェーズ（テキスト層の解析 / OCR 実行） */
	phase: 'parse' | 'ocr';
	/** 利用者向けの日本語メッセージ */
	message: string;
	/** 0〜1 の進捗率（分かる場合のみ） */
	ratio?: number;
}

/**
 * 検査対象コンテンツの取得口（外部 I/O の境界）。
 * ファイル読込・PDF抽出・URL取得といったブラウザ I/O を抽象化する。
 * 実装は infrastructure/adapters に置き、本番実装と Stub を Composition で切り替える。
 */
export interface ContentSourceGateway {
	/** テキストファイルをローカルで読み込み、文字列として返す（外部送信しない） */
	readFile(file: File): Promise<string>;
	/**
	 * PDF をローカルで読み込みテキストを抽出して返す（外部送信しない）。
	 * 文字を選択できる PDF はテキスト層を、選択できない画像 PDF はブラウザ内 OCR を用いる。
	 */
	readPdf(file: File, onProgress?: PdfProgressCallback): Promise<string>;
	/** URL の内容を取得し、文字列として返す（CORS 制約の影響を受ける） */
	fetchUrl(url: string): Promise<string>;
}
