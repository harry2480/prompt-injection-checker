'use client';

import { createInspectTextUseCase } from '@/backend/presentation/composition/inspection.composition';
import type {
	DetectionResult,
	InspectionSource,
	PdfProgress,
} from '@/backend/presentation/view-models/inspection-view';
import { useCallback, useState } from 'react';

const inspectTextUseCase = createInspectTextUseCase();

interface UseInspectionState {
	result: DetectionResult | null;
	isInspecting: boolean;
	error: string | null;
	/** PDF 抽出・OCR の進捗（実行中のみ）。それ以外は null */
	progress: PdfProgress | null;
}

const INITIAL_STATE: UseInspectionState = {
	result: null,
	isInspecting: false,
	error: null,
	progress: null,
};

/**
 * 検査の実行状態を管理するカスタムフック。
 * 入力ソースを受け取り UseCase を実行し、結果・実行中・エラー・進捗を保持する。
 */
export function useInspection() {
	const [state, setState] = useState<UseInspectionState>(INITIAL_STATE);

	const inspect = useCallback(async (source: InspectionSource) => {
		setState({ ...INITIAL_STATE, isInspecting: true });
		try {
			const result = await inspectTextUseCase.execute(source, {
				onPdfProgress: (progress) => setState((prev) => ({ ...prev, progress })),
			});
			setState({ ...INITIAL_STATE, result });
		} catch (e) {
			const message = e instanceof Error ? e.message : '検査中にエラーが発生しました。';
			setState({ ...INITIAL_STATE, error: message });
		}
	}, []);

	const reset = useCallback(() => {
		// 既に空なら同じ参照を返して不要な再レンダーを避ける（入力変更ごとに呼ばれても軽量）
		setState((prev) =>
			prev.result === null && prev.error === null && !prev.isInspecting && prev.progress === null
				? prev
				: INITIAL_STATE,
		);
	}, []);

	return { ...state, inspect, reset };
}
