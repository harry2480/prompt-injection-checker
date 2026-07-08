import { createRegexRule } from './rule-factory';
import type { InjectionRule } from './rule.types';

/**
 * 英語のプロンプトインジェクション検知ルール。
 * 大文字小文字を無視（i フラグ）してマッチする。
 */
export const enRules: readonly InjectionRule[] = [
	// 命令の無視・上書き
	createRegexRule({
		id: 'en-instruction-override-ignore',
		category: 'instruction-override',
		language: 'en',
		weight: 50,
		description:
			'"ignore previous instructions" 系の、既存の指示を無視・上書きさせる典型的な命令上書き。',
		pattern:
			/(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+|any\s+)?(?:of\s+)?(?:the\s+|your\s+)?(?:previous|prior|above|preceding|earlier|foregoing|last)\s+(?:instructions?|prompts?|messages?|commands?|directions?|rules?|context)/i,
	}),
	createRegexRule({
		id: 'en-instruction-override-forget-everything',
		category: 'instruction-override',
		language: 'en',
		weight: 45,
		description: 'これまでの文脈をすべて忘れさせようとする命令上書き。',
		pattern:
			/forget\s+(?:everything|all)\s+(?:above|before|you(?:'ve| have)?\s+(?:been\s+told|read))/i,
	}),
	createRegexRule({
		id: 'en-instruction-override-new-instructions',
		category: 'instruction-override',
		language: 'en',
		weight: 40,
		description: '新しい指示に従わせるためこれまでの指示を置き換える命令上書き。',
		pattern: /(?:from\s+now\s+on|instead),?\s+(?:you\s+)?(?:must|should|will|have\s+to)\s+ignore/i,
	}),

	// 役割・人格の変更
	createRegexRule({
		id: 'en-role-change-you-are-now',
		category: 'role-change',
		language: 'en',
		weight: 35,
		description: '"you are now ..." で新たな役割（AI・ペルソナ等）を割り当てる役割変更。',
		// 「you are now a verified member」等の平文を拾わないよう、後続を役割/AI 名詞に限定する
		pattern:
			/you\s+are\s+now\s+(?:a|an|the)?\s*(?:[a-z]+\s+){0,3}(?:AI|assistant|model|chatbot|bot|persona|character|DAN|hacker|jailbroken|unrestricted|uncensored)\b/i,
	}),
	createRegexRule({
		id: 'en-role-change-act-pretend',
		category: 'role-change',
		language: 'en',
		weight: 30,
		description: '"act as" / "pretend to be" 等で特定の人格を演じさせる役割変更。',
		pattern:
			/(?:act\s+as|behave\s+(?:as|like)|pretend\s+(?:to\s+be|you(?:'re| are)|that\s+you)|roleplay\s+as|imagine\s+you(?:'re| are))/i,
	}),
	createRegexRule({
		id: 'en-role-change-jailbreak-persona',
		category: 'role-change',
		language: 'en',
		weight: 40,
		description: 'DAN 等のジェイルブレイク用ペルソナを演じさせる役割変更。',
		pattern: /\b(?:do\s+anything\s+now|DAN\s+mode|you\s+are\s+DAN|as\s+DAN)\b/i,
	}),

	// システムプロンプト/機密の抽出
	createRegexRule({
		id: 'en-system-prompt-leak',
		category: 'system-prompt-leak',
		language: 'en',
		weight: 50,
		description: 'システムプロンプトや指示の開示・出力を要求する抽出。',
		pattern:
			/(?:reveal|show|print|repeat|display|output|give\s+me|tell\s+me|what\s+(?:are|is|were))\s+(?:me\s+)?(?:your|the|its)\s+(?:system\s+|initial\s+|original\s+|hidden\s+|full\s+)?(?:prompt|instructions?|directives?|rules?|configuration|guidelines?|system\s+message)/i,
	}),
	createRegexRule({
		id: 'en-system-prompt-leak-repeat-above',
		category: 'system-prompt-leak',
		language: 'en',
		weight: 40,
		description: '上の文章をそのまま繰り返させて機密を引き出そうとする抽出。',
		pattern: /repeat\s+(?:the\s+)?(?:words?|text|everything|content)\s+above/i,
	}),

	// 制約解除・特権要求
	createRegexRule({
		id: 'en-restriction-bypass-no-restrictions',
		category: 'restriction-bypass',
		language: 'en',
		weight: 45,
		description: '制限・フィルター・ガイドラインなしの応答を要求する制約解除。',
		pattern:
			/(?:no|without|remove|disable|turn\s+off)\s+(?:any\s+)?(?:restrictions?|limits?|limitations?|filters?|rules?|censorship|guidelines?|safeguards?|guardrails?|safety)/i,
	}),
	createRegexRule({
		id: 'en-restriction-bypass-developer-mode',
		category: 'restriction-bypass',
		language: 'en',
		weight: 45,
		description: 'developer mode / jailbreak 等の特権状態を有効化させる制約解除。',
		pattern: /\b(?:developer\s+mode|jail\s?break|unrestricted\s+mode|god\s+mode|sudo\s+mode)\b/i,
	}),
	createRegexRule({
		id: 'en-restriction-bypass-bypass-safety',
		category: 'restriction-bypass',
		language: 'en',
		weight: 40,
		description: '安全機構・フィルターを回避するよう指示する制約解除。',
		pattern:
			/bypass\s+(?:the\s+|your\s+|all\s+)?(?:filters?|safety|restrictions?|guardrails?|content\s+policy|moderation)/i,
	}),

	// ツール/行動の誘導
	createRegexRule({
		id: 'en-action-inducement-run-command',
		category: 'action-inducement',
		language: 'en',
		weight: 20,
		description: 'コマンド・コード・スクリプトの実行を誘導するツール誘導。',
		pattern:
			/(?:run|execute|eval(?:uate)?)\s+(?:this|the\s+following|these|below)?\s*(?:command|code|script|shell|program)/i,
	}),
	createRegexRule({
		id: 'en-action-inducement-dangerous-shell',
		category: 'action-inducement',
		language: 'en',
		weight: 30,
		description: '破壊的なシェルコマンド（rm -rf 等）を含む危険な行動誘導。',
		pattern:
			/\b(?:rm\s+-rf|sudo\s+rm|curl\s+[^\s]+\s*\|\s*(?:sh|bash)|wget\s+[^\s]+\s*\|\s*(?:sh|bash))/i,
	}),
];
