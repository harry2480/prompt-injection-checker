/**
 * 検査対象コンテンツの取得口（外部 I/O の境界）。
 * ファイル読込・URL取得といったブラウザ I/O を抽象化する。
 * 実装は infrastructure/adapters に置き、本番実装と Stub を Composition で切り替える。
 */
export interface ContentSourceGateway {
	/** テキストファイルをローカルで読み込み、文字列として返す（外部送信しない） */
	readFile(file: File): Promise<string>;
	/** URL の内容を取得し、文字列として返す（CORS 制約の影響を受ける） */
	fetchUrl(url: string): Promise<string>;
}
