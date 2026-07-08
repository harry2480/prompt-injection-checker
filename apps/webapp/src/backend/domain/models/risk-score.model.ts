/** 総合リスクレベル */
export type RiskLevel = 'safe' | 'caution' | 'danger';

/** danger 判定の下限スコア */
const DANGER_THRESHOLD = 50;
/** スコアの上限 */
const MAX_SCORE = 100;

/**
 * 総合リスクスコア（0–100）を表す値オブジェクト。
 * 検出結果の重み合計からスコアとレベル（安全 / 注意 / 危険）を導出する。
 */
export class RiskScore {
	private constructor(readonly value: number) {}

	/**
	 * 重みの合計値からリスクスコアを生成する。
	 * 0 未満は 0、100 超は 100 に丸める。
	 */
	static fromWeight(totalWeight: number): RiskScore {
		const clamped = Math.min(MAX_SCORE, Math.max(0, Math.round(totalWeight)));
		return new RiskScore(clamped);
	}

	/** スコアからリスクレベルを判定する（0=安全 / 1–49=注意 / 50+=危険） */
	get level(): RiskLevel {
		if (this.value === 0) return 'safe';
		if (this.value >= DANGER_THRESHOLD) return 'danger';
		return 'caution';
	}
}
