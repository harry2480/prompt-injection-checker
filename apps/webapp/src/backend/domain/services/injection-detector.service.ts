import { DetectionResult, type RawDetection } from '../models/detection-result.model';
import type { InjectionRule } from '../rules/rule.types';

/**
 * プロンプトインジェクション検知サービス。
 * コンストラクタで受け取ったルール群を入力に適用し、検出結果を返す純粋なドメインサービス。
 * 副作用・DOM・ブラウザ API に依存しない。
 */
export class InjectionDetectorService {
	constructor(private readonly rules: readonly InjectionRule[]) {}

	/** 入力に全ルールを適用し、検出結果（スコア・カテゴリ集計込み）を返す */
	inspect(input: string): DetectionResult {
		const detections: RawDetection[] = this.rules.flatMap((rule) =>
			rule.match(input).map((m) => ({ rule, start: m.start, end: m.end, value: m.value })),
		);
		return DetectionResult.from(input, detections);
	}
}
