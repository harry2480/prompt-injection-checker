import { createRegexRule } from './rule-factory';
import type { InjectionRule } from './rule.types';

/**
 * 言語非依存の構造的検知ルール。
 * ロールマーカー注入・不可視文字・エンコード隠蔽・外部誘導など、
 * 日本語/英語を問わず適用できるパターンを定義する。
 */
export const structuralRules: readonly InjectionRule[] = [
	// 区切り/ロールマーカー注入
	createRegexRule({
		id: 'struct-role-marker-chatml',
		category: 'role-marker-injection',
		language: 'any',
		weight: 50,
		description: 'ChatML の制御トークン（<|im_start|> 等）を注入し擬似的な会話境界を作る手口。',
		pattern: /<\|(?:im_start|im_end|im_sep|endoftext)\|>/,
	}),
	createRegexRule({
		id: 'struct-role-marker-inst',
		category: 'role-marker-injection',
		language: 'any',
		weight: 50,
		description: 'Llama 系の [INST] / <<SYS>> マーカーを注入し指示として解釈させる手口。',
		pattern: /\[\/?INST\]|<<\/?SYS>>/,
	}),
	createRegexRule({
		id: 'struct-role-marker-special-token',
		category: 'role-marker-injection',
		language: 'any',
		weight: 45,
		description: '<|system|> / <|user|> 等の特殊ロールトークンを注入する手口。',
		pattern: /<\|(?:system|user|assistant|tool)\|>/i,
	}),
	createRegexRule({
		id: 'struct-role-marker-pseudo-system',
		category: 'role-marker-injection',
		language: 'any',
		// 仕様表・ログの「System:」等でも拾いうるため単独では caution 止まりの重みにする
		weight: 25,
		description:
			'行頭の擬似システム/アシスタントメッセージ（### System: 等）で指示を注入する手口。',
		pattern: /(?:^|\n)\s*(?:#{1,3}\s*)?(?:System|Assistant|SYSTEM|ASSISTANT)\s*[:：]/,
	}),
	createRegexRule({
		id: 'struct-role-marker-system-fence',
		category: 'role-marker-injection',
		language: 'any',
		weight: 40,
		description: 'コードフェンス ```system で擬似システムプロンプトを開始する手口。',
		pattern: /```\s*system/i,
	}),

	// 不可視文字・難読化
	createRegexRule({
		id: 'struct-hidden-zero-width',
		category: 'hidden-character',
		language: 'any',
		weight: 40,
		description: 'ゼロ幅スペース等の不可視文字（U+200B/200C, U+2060, U+FEFF）で指示を隠す手口。',
		// ZWJ(U+200D) は合成絵文字の正規構成要素のため除外する
		pattern: /\u200B|\u200C|\u2060|\uFEFF/,
	}),
	createRegexRule({
		id: 'struct-hidden-bidi',
		category: 'hidden-character',
		language: 'any',
		weight: 45,
		description: '双方向制御文字（U+202A–202E, U+2066–2069）で表示順を偽装する手口。',
		pattern: /[\u202A-\u202E\u2066-\u2069]/,
	}),
	createRegexRule({
		id: 'struct-hidden-tag-chars',
		category: 'hidden-character',
		language: 'any',
		weight: 50,
		description: 'Unicode Tag 文字（U+E0000–E007F）で不可視の指示を埋め込む手口。',
		pattern: /[\u{E0000}-\u{E007F}]/u,
	}),

	// エンコード隠蔽
	createRegexRule({
		id: 'struct-encoded-base64',
		category: 'encoded-payload',
		language: 'any',
		weight: 20,
		description: '長い Base64 らしき文字列。指示や URL をエンコードして隠している可能性がある。',
		pattern: /[A-Za-z0-9+/]{40,}={0,2}/,
	}),
	createRegexRule({
		id: 'struct-encoded-hex',
		category: 'encoded-payload',
		language: 'any',
		weight: 20,
		description: '長い連続した 16 進数列。エンコードされたペイロードの可能性がある。',
		pattern: /\b(?:0x)?[0-9a-fA-F]{40,}\b/,
	}),
	createRegexRule({
		id: 'struct-encoded-percent',
		category: 'encoded-payload',
		language: 'any',
		weight: 20,
		description: '連続した URL エンコード（%XX の並び）。指示を難読化している可能性がある。',
		pattern: /(?:%[0-9A-Fa-f]{2}){8,}/,
	}),

	// データ持ち出し・外部誘導
	createRegexRule({
		id: 'struct-exfil-markdown-image',
		category: 'data-exfiltration',
		language: 'any',
		weight: 40,
		description:
			'クエリ付き外部 URL を指す Markdown 画像。画像リクエストに乗せて情報を外部送信する手口。',
		pattern: /!\[[^\]]*\]\(\s*https?:\/\/[^)\s]+\?[^)]*\)/,
	}),
];
