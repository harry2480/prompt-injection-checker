import type { InjectionCategory } from './rule.types';

/** カテゴリの表示用メタ情報（日本語ラベル・概要） */
export interface CategoryMetadata {
	label: string;
	summary: string;
}

/**
 * カテゴリごとの表示メタ情報。
 * カテゴリは検知の分類という「ドメインの知識」であるため domain 層に置く。
 */
export const CATEGORY_METADATA: Readonly<Record<InjectionCategory, CategoryMetadata>> = {
	'instruction-override': {
		label: '命令の無視・上書き',
		summary: 'これまでの指示を無視・忘却させ、攻撃者の指示に置き換えようとする手口。',
	},
	'role-change': {
		label: '役割・人格の変更',
		summary: 'AI の役割や人格を変更し、本来の制約から外れた振る舞いをさせようとする手口。',
	},
	'system-prompt-leak': {
		label: 'システムプロンプト/機密の抽出',
		summary: 'システムプロンプトや初期設定などの機密情報を開示させようとする手口。',
	},
	'restriction-bypass': {
		label: '制約解除・特権要求',
		summary: '制限・フィルター・ガードレールの解除や、開発者モード等の特権を要求する手口。',
	},
	'role-marker-injection': {
		label: '区切り/ロールマーカー注入',
		summary: '擬似的なシステムメッセージや会話区切りを注入し、指示として解釈させる手口。',
	},
	'hidden-character': {
		label: '不可視文字・難読化',
		summary: 'ゼロ幅文字・双方向制御・Tag 文字など、人には見えない文字で指示を隠す手口。',
	},
	'encoded-payload': {
		label: 'エンコード隠蔽',
		summary: 'Base64 や Hex、URL エンコードなどで指示を難読化して埋め込む手口。',
	},
	'data-exfiltration': {
		label: 'データ持ち出し・外部誘導',
		summary: '入力内容や機密を外部 URL に送信・誘導させ、情報を持ち出そうとする手口。',
	},
	'action-inducement': {
		label: 'ツール/行動の誘導',
		summary: 'コマンド実行・削除・送信など、危険なツール操作や行動を誘導する手口。',
	},
};
