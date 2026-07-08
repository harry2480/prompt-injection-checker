import type { RiskLevel } from '../../domain/models/risk-score.model';

/**
 * frontend が検査結果を描画するために参照する型・メタ情報の窓口（presentation 層）。
 * frontend は domain / application / infrastructure を直接 import せず、この presentation 経由で利用する。
 */

// 検査結果まわりの型を presentation 経由で公開（frontend からの直接 domain 参照を避ける）
export type {
	CategorySummary,
	Detection,
	DetectionResult,
} from '../../domain/models/detection-result.model';
export type { RiskLevel } from '../../domain/models/risk-score.model';
export type { InjectionCategory } from '../../domain/rules/rule.types';
export { CATEGORY_METADATA } from '../../domain/rules/category-metadata';
export type { CategoryMetadata } from '../../domain/rules/category-metadata';
export type { InspectionSource } from '../../application/usecases/inspect-text.usecase';

/** リスクレベルの表示用メタ情報 */
export interface RiskLevelMetadata {
	/** 表示ラベル */
	label: string;
	/** 補足説明 */
	description: string;
}

/** リスクレベルごとの表示メタ情報 */
export const RISK_LEVEL_METADATA: Readonly<Record<RiskLevel, RiskLevelMetadata>> = {
	safe: {
		label: '安全',
		description: '既知のインジェクションパターンは検出されませんでした。',
	},
	caution: {
		label: '注意',
		description: '疑わしいパターンが検出されました。内容を確認してください。',
	},
	danger: {
		label: '危険',
		description: '明確なインジェクションの疑いがあります。取り扱いに注意してください。',
	},
};
