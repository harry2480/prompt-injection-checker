import type { InjectionCategory, InjectionRule, RuleLanguage } from '../rules/rule.types';
import { RiskScore } from './risk-score.model';

/** 検知エンジンが生成する、ルールとマッチ範囲を紐付けた生の検出（内部入力用） */
export interface RawDetection {
	rule: InjectionRule;
	start: number;
	end: number;
	value: string;
}

/** UI に提示する 1 件の検出。ルールのメタ情報とマッチ範囲を保持する */
export interface Detection {
	ruleId: string;
	category: InjectionCategory;
	language: RuleLanguage;
	weight: number;
	description: string;
	start: number;
	end: number;
	value: string;
}

/** カテゴリ別の集計 */
export interface CategorySummary {
	category: InjectionCategory;
	count: number;
	totalWeight: number;
}

/**
 * 検査結果の集約ルート（Rich Domain Model）。
 * 生の検出からスコア・カテゴリ別集計を導出し、UI 表示に必要な情報を提供する。
 */
export class DetectionResult {
	private constructor(
		readonly input: string,
		readonly detections: readonly Detection[],
		readonly score: RiskScore,
	) {}

	/**
	 * 入力と生の検出から検査結果を生成する。
	 * 検出は開始位置（同位置なら終了位置）昇順にソートし、重み合計からスコアを算出する。
	 */
	static from(input: string, raw: readonly RawDetection[]): DetectionResult {
		const detections = raw
			.map(
				(r): Detection => ({
					ruleId: r.rule.id,
					category: r.rule.category,
					language: r.rule.language,
					weight: r.rule.weight,
					description: r.rule.description,
					start: r.start,
					end: r.end,
					value: r.value,
				}),
			)
			.sort((a, b) => a.start - b.start || a.end - b.end);

		const deduped = DetectionResult.dedupeOverlaps(detections);
		const totalWeight = deduped.reduce((sum, d) => sum + d.weight, 0);
		return new DetectionResult(input, deduped, RiskScore.fromWeight(totalWeight));
	}

	/**
	 * 同一カテゴリで範囲が重なる検出を 1 件にまとめる（重みは高い方、同値なら広い方を採用）。
	 * 複数ルールが同じ箇所を捉えた場合（例: Base64 と Hex が同じ列にヒット）の
	 * スコア二重計上を防ぐ。異なるカテゴリや、重ならない同一カテゴリの検出は保持する。
	 */
	private static dedupeOverlaps(sorted: readonly Detection[]): Detection[] {
		const kept: Detection[] = [];
		for (const d of sorted) {
			// d と重なる同一カテゴリの既存検出をすべて集める
			// （広い d が複数の既存と重なるケースを取りこぼさない）
			const overlapping = kept.filter(
				(k) => k.category === d.category && d.start < k.end && k.start < d.end,
			);
			if (overlapping.length === 0) {
				kept.push(d);
				continue;
			}
			// d が重なる全既存より優先される（重みが高い、同値なら広い）場合のみ置き換える
			const dWidth = d.end - d.start;
			const dWins = overlapping.every(
				(k) => d.weight > k.weight || (d.weight === k.weight && dWidth > k.end - k.start),
			);
			if (dWins) {
				for (const k of overlapping) {
					kept.splice(kept.indexOf(k), 1);
				}
				kept.push(d);
			}
			// dWins でなければ d は破棄し既存を優先する（kept は同一カテゴリで非重複を維持）
		}
		return kept.sort((a, b) => a.start - b.start || a.end - b.end);
	}

	/** 検出が 1 件もないか */
	get isEmpty(): boolean {
		return this.detections.length === 0;
	}

	/** 検出総数 */
	get detectionCount(): number {
		return this.detections.length;
	}

	/**
	 * カテゴリ別の集計を返す。
	 * 件数の多い順（同数なら重み合計の多い順）に並べる。
	 */
	categorySummary(): CategorySummary[] {
		const map = new Map<InjectionCategory, CategorySummary>();
		for (const d of this.detections) {
			const current = map.get(d.category);
			if (current) {
				current.count += 1;
				current.totalWeight += d.weight;
			} else {
				map.set(d.category, { category: d.category, count: 1, totalWeight: d.weight });
			}
		}
		return [...map.values()].sort((a, b) => b.count - a.count || b.totalWeight - a.totalWeight);
	}
}
