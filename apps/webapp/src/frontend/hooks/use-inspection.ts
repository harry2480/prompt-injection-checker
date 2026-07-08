'use client';

import { createInspectTextUseCase } from '@/backend/presentation/composition/inspection.composition';
import type {
	DetectionResult,
	InspectionSource,
} from '@/backend/presentation/view-models/inspection-view';
import { useCallback, useState } from 'react';

const inspectTextUseCase = createInspectTextUseCase();

interface UseInspectionState {
	result: DetectionResult | null;
	isInspecting: boolean;
	error: string | null;
}

/**
 * 検査の実行状態を管理するカスタムフック。
 * 入力ソースを受け取り UseCase を実行し、結果・実行中・エラーを保持する。
 */
export function useInspection() {
	const [state, setState] = useState<UseInspectionState>({
		result: null,
		isInspecting: false,
		error: null,
	});

	const inspect = useCallback(async (source: InspectionSource) => {
		setState((prev) => ({ ...prev, isInspecting: true, error: null }));
		try {
			const result = await inspectTextUseCase.execute(source);
			setState({ result, isInspecting: false, error: null });
		} catch (e) {
			const message = e instanceof Error ? e.message : '検査中にエラーが発生しました。';
			setState({ result: null, isInspecting: false, error: message });
		}
	}, []);

	const reset = useCallback(() => {
		// 既に空なら同じ参照を返して不要な再レンダーを避ける（入力変更ごとに呼ばれても軽量）
		setState((prev) =>
			prev.result === null && prev.error === null && !prev.isInspecting
				? prev
				: { result: null, isInspecting: false, error: null },
		);
	}, []);

	return { ...state, inspect, reset };
}
