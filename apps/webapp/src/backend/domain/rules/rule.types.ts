/**
 * 検知ルールの型定義。
 * ルールは「データ（配列・定数）」として宣言的に管理し、検知エンジン（コード）から分離する。
 */

/** インジェクション手口のカテゴリ */
export type InjectionCategory =
	| 'instruction-override' // 命令の無視・上書き
	| 'role-change' // 役割・人格の変更
	| 'system-prompt-leak' // システムプロンプト/機密の抽出
	| 'restriction-bypass' // 制約解除・特権要求
	| 'role-marker-injection' // 区切り/ロールマーカー注入
	| 'hidden-character' // 不可視文字・難読化
	| 'encoded-payload' // エンコード隠蔽
	| 'data-exfiltration' // データ持ち出し・外部誘導
	| 'action-inducement'; // ツール/行動の誘導

/** ルールの対応言語（言語非依存は 'any'） */
export type RuleLanguage = 'ja' | 'en' | 'any';

/** ルールがマッチした 1 箇所の範囲（半開区間 [start, end)） */
export interface RuleMatch {
	/** マッチ開始位置（0 始まり、コードユニット単位） */
	start: number;
	/** マッチ終了位置（この位置は含まない） */
	end: number;
	/** マッチした文字列 */
	value: string;
}

/**
 * 1 つの検知ルール。
 * `match` は入力を受け取り検出範囲の配列を返す純粋関数（副作用・外部依存なし）。
 */
export interface InjectionRule {
	/** 一意な識別子（例: 'ja-instruction-override-ignore'） */
	id: string;
	category: InjectionCategory;
	language: RuleLanguage;
	/** リスクスコアへの寄与（0–100 の重み） */
	weight: number;
	/** なぜ危険か（UI 表示用の説明） */
	description: string;
	/** 入力にルールを適用し、マッチ範囲の配列を返す（マッチなしは空配列） */
	match: (input: string) => RuleMatch[];
}
