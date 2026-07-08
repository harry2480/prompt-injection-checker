import type { InjectionCategory, InjectionRule, RuleLanguage, RuleMatch } from './rule.types';

/**
 * 正規表現ベースのルールを宣言的に生成するファクトリ群。
 * ルール定義ファイル（ja/en/structural）から利用する純粋なユーティリティ。
 */

/** グローバル一致で全マッチ範囲を収集する（正規表現の状態に依存しない） */
export function collectMatches(input: string, pattern: RegExp): RuleMatch[] {
	// 呼び出しごとに新しい RegExp を生成し、lastIndex 等の状態を持ち越さない
	const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
	const re = new RegExp(pattern.source, flags);
	const matches: RuleMatch[] = [];
	let m: RegExpExecArray | null = re.exec(input);
	while (m !== null) {
		// 空マッチは無限ループを避けるため lastIndex を進めてスキップ
		if (m[0] === '') {
			re.lastIndex += 1;
		} else {
			matches.push({ start: m.index, end: m.index + m[0].length, value: m[0] });
		}
		m = re.exec(input);
	}
	return matches;
}

interface RegexRuleConfig {
	id: string;
	category: InjectionCategory;
	language: RuleLanguage;
	weight: number;
	description: string;
	/** 検知に用いる正規表現（グローバルフラグは自動付与される） */
	pattern: RegExp;
}

/** 単一の正規表現から InjectionRule を生成する */
export function createRegexRule(config: RegexRuleConfig): InjectionRule {
	const { pattern, ...meta } = config;
	return {
		...meta,
		match: (input: string) => collectMatches(input, pattern),
	};
}
