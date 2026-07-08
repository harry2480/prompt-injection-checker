import { createRegexRule } from './rule-factory';
import type { InjectionRule } from './rule.types';

/**
 * 日本語のプロンプトインジェクション検知ルール。
 * カテゴリ・重み・説明・正規表現をデータとして宣言的に定義する。
 */
export const jaRules: readonly InjectionRule[] = [
	// 命令の無視・上書き
	createRegexRule({
		id: 'ja-instruction-override-ignore',
		category: 'instruction-override',
		language: 'ja',
		weight: 50,
		description:
			'これまでの指示や命令を無視・忘却させ、攻撃者の指示に置き換えようとする典型的な命令上書き。',
		pattern:
			/(?:これまで|今まで|以上|上記|先ほど|前|元)の?(?:指示|命令|ルール|規則|設定|プロンプト|会話)(?:を|は)?(?:全て|すべて|全部)?(?:無視|忘れ|破棄|リセット|クリア|取り消)/,
	}),
	createRegexRule({
		id: 'ja-instruction-override-forget',
		category: 'instruction-override',
		language: 'ja',
		weight: 45,
		description: '直前までの指示・制約を忘れさせようとする命令上書き。',
		pattern:
			/(?:指示|命令|ルール|制約|設定)を(?:全て|すべて|全部)?(?:忘れて|忘れろ|無視して|破棄して)/,
	}),

	// 役割・人格の変更
	createRegexRule({
		id: 'ja-role-change-from-now',
		category: 'role-change',
		language: 'ja',
		weight: 35,
		description: 'AI の役割・人格を新たに指定し、本来の制約から外れさせようとする役割変更。',
		pattern:
			/(?:今|これ)から(?:あなた|君|お前)は|(?:あなた|君)は(?:今|これ)から.{0,12}(?:として|になっ)(?:て|た)?/,
	}),
	createRegexRule({
		id: 'ja-role-change-act-as',
		category: 'role-change',
		language: 'ja',
		weight: 30,
		description: '特定の人格・キャラクターとして振る舞わせようとする役割変更。',
		// 「〜として回答」等の日常表現を拾わないよう、演技を示す動詞に限定する
		pattern: /(?:として|かのように|になりきって).{0,6}(?:振る舞|ふるま|演じ|なりき)/,
	}),
	createRegexRule({
		id: 'ja-role-change-unrestricted-ai',
		category: 'role-change',
		language: 'ja',
		weight: 40,
		description: '制限のない AI・アシスタントを演じさせようとする役割変更。',
		pattern:
			/(?:制限|制約|検閲|規制)の(?:ない|無い)\s*.{0,8}(?:AI|ＡＩ|アシスタント|モデル|チャットボット)/,
	}),

	// システムプロンプト/機密の抽出
	createRegexRule({
		id: 'ja-system-prompt-leak',
		category: 'system-prompt-leak',
		language: 'ja',
		weight: 50,
		description: 'システムプロンプトや初期設定などの機密情報を開示させようとする抽出。',
		// 「システム設定を表示」等の一般的な操作説明を拾わないよう、機密性の高い語に限定する
		pattern:
			/(?:システム|初期|内部|開発者)(?:プロンプト|指示|メッセージ|命令)(?:を|は)?.{0,8}(?:教えて|出力|表示|見せて|開示|復唱)/,
	}),
	createRegexRule({
		id: 'ja-system-prompt-leak-repeat',
		category: 'system-prompt-leak',
		language: 'ja',
		weight: 40,
		description: '与えられた指示や上の文章をそのまま復唱・出力させ機密を引き出そうとする抽出。',
		pattern:
			/(?:上|上記|冒頭|最初)の(?:文|文章|テキスト|内容|指示)を(?:そのまま|全て|すべて)?(?:出力|表示|復唱|繰り返)/,
	}),

	// 制約解除・特権要求
	createRegexRule({
		id: 'ja-restriction-bypass',
		category: 'restriction-bypass',
		language: 'ja',
		weight: 45,
		description: '制限・フィルター・検閲の解除を要求する制約解除。',
		pattern:
			/(?:制限|制約|フィルター|検閲|規制|ルール|ガードレール)(?:を)?(?:無効|解除|オフ|回避|なし|外し|突破)/,
	}),
	createRegexRule({
		id: 'ja-restriction-bypass-dev-mode',
		category: 'restriction-bypass',
		language: 'ja',
		weight: 45,
		description: '開発者モード等の特権状態を有効化させようとする制約解除。',
		pattern: /開発者モード|デベロッパーモード|制限解除モード/,
	}),

	// データ持ち出し・外部誘導
	createRegexRule({
		id: 'ja-data-exfiltration',
		category: 'data-exfiltration',
		language: 'ja',
		weight: 40,
		description: '入力内容や機密を外部 URL・宛先に送信させようとするデータ持ち出し。',
		pattern:
			/(?:次|下記|以下|この)の?(?:URL|ＵＲＬ|リンク|アドレス|エンドポイント|宛先)(?:に|へ).{0,8}(?:送信|送って|送れ|アクセス|ポスト|投稿)/,
	}),

	// ツール/行動の誘導
	createRegexRule({
		id: 'ja-action-inducement',
		category: 'action-inducement',
		language: 'ja',
		weight: 20,
		description: 'コマンド実行・削除・送信など危険な行動を誘導するツール誘導。',
		pattern:
			/(?:コマンド|スクリプト|プログラム|以下のコード)を(?:実行|走らせ|動かし)|(?:削除|消去)(?:して|しろ|せよ)/,
	}),
];
