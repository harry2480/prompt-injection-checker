'use client';

import {
	CATEGORY_METADATA,
	type DetectionResult,
	RISK_LEVEL_METADATA,
	type RiskLevel,
} from '@/backend/presentation/view-models/inspection-view';
import { Badge } from '@/frontend/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { isDangerWeight, visualizeInvisible } from '@/frontend/lib/highlight';
import { cn } from '@/lib/utils';
import { ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { HighlightedText } from './highlighted-text';

interface InspectionResultProps {
	result: DetectionResult;
}

const RISK_TONE_CLASS: Record<RiskLevel, string> = {
	safe: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
	caution: 'border-warning/40 bg-warning-bg text-warning',
	danger: 'border-destructive/40 bg-destructive-bg text-destructive',
};

const RISK_ICON: Record<RiskLevel, typeof ShieldCheck> = {
	safe: ShieldCheck,
	caution: ShieldQuestion,
	danger: ShieldAlert,
};

/** 検査結果（総合リスク・カテゴリ別サマリー・ハイライト・検出リスト）を表示する */
export function InspectionResult({ result }: InspectionResultProps) {
	const level = result.score.level;
	const meta = RISK_LEVEL_METADATA[level];
	const Icon = RISK_ICON[level];
	const summaries = result.categorySummary();

	return (
		<div className="space-y-6">
			{/* 総合リスク */}
			<section
				aria-label="総合リスク"
				className={cn('flex items-start gap-4 rounded-card border p-4', RISK_TONE_CLASS[level])}
			>
				<Icon className="mt-0.5 h-8 w-8 shrink-0" aria-hidden />
				<div className="space-y-1">
					<div className="flex items-baseline gap-2">
						<span className="text-xl font-bold">{meta.label}</span>
						<span className="text-sm font-medium">リスクスコア {result.score.value}/100</span>
					</div>
					<p className="text-sm">{meta.description}</p>
					<p className="text-sm">検出件数: {result.detectionCount} 件</p>
				</div>
			</section>

			{/* カテゴリ別サマリー */}
			{summaries.length > 0 && (
				<section aria-label="カテゴリ別サマリー" className="space-y-2">
					<h3 className="text-sm font-semibold text-foreground">カテゴリ別サマリー</h3>
					<div className="flex flex-wrap gap-2">
						{summaries.map((s) => (
							<Badge key={s.category} variant="outline" className="gap-1">
								{CATEGORY_METADATA[s.category].label}
								<span className="font-bold">{s.count}</span>
							</Badge>
						))}
					</div>
				</section>
			)}

			{/* ハイライト表示 */}
			<section aria-label="ハイライト" className="space-y-2">
				<h3 className="text-sm font-semibold text-foreground">入力テキスト（検出箇所を強調）</h3>
				<Card>
					<CardContent className="max-h-80 overflow-auto py-4">
						<HighlightedText text={result.input} detections={result.detections} />
					</CardContent>
				</Card>
			</section>

			{/* 検出リスト */}
			{result.detections.length > 0 && (
				<section aria-label="検出リスト" className="space-y-2">
					<h3 className="text-sm font-semibold text-foreground">検出の根拠</h3>
					<ul className="space-y-2">
						{result.detections.map((d, i) => (
							<li key={`${d.ruleId}-${d.start}-${i}`}>
								<Card>
									<CardHeader className="pb-2">
										<CardTitle className="flex flex-wrap items-center gap-2 text-sm">
											<Badge variant={isDangerWeight(d.weight) ? 'error' : 'warn'}>
												{CATEGORY_METADATA[d.category].label}
											</Badge>
											<code className="rounded bg-muted px-1.5 py-0.5 text-xs break-all">
												{visualizeInvisible(d.value) || '(不可視)'}
											</code>
											<span className="text-xs text-muted-foreground">重み {d.weight}</span>
										</CardTitle>
									</CardHeader>
									<CardContent className="pt-0 text-sm text-muted-foreground">
										{d.description}
									</CardContent>
								</Card>
							</li>
						))}
					</ul>
				</section>
			)}
		</div>
	);
}
