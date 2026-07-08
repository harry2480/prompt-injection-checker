'use client';

import { useInspection } from '@/frontend/hooks/use-inspection';
import { AlertTriangle } from 'lucide-react';
import { InspectionForm } from './inspection-form';
import { InspectionResult } from './inspection-result';

/**
 * 検査機能のコンテナ。入力フォーム・エラー表示・検査結果を束ね、フックで状態を管理する。
 */
export function InjectionInspector() {
	const { result, isInspecting, error, inspect, reset } = useInspection();

	return (
		<div className="space-y-6">
			<InspectionForm onInspect={inspect} onClear={reset} isInspecting={isInspecting} />

			{error && (
				<div
					role="alert"
					className="flex items-start gap-2 rounded-card border border-destructive/40 bg-destructive-bg p-3 text-sm text-destructive"
				>
					<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
					<span>{error}</span>
				</div>
			)}

			{result && <InspectionResult result={result} />}
		</div>
	);
}
