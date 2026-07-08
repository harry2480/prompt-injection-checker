import type { Detection } from '@/backend/presentation/view-models/inspection-view';

/** 検出単体を「危険（赤）」表示にする重みの下限。これ未満は「注意（黄）」表示 */
export const DETECTION_DANGER_WEIGHT = 45;

/** 検出の重みが危険色（赤）表示に該当するか */
export function isDangerWeight(weight: number): boolean {
	return weight >= DETECTION_DANGER_WEIGHT;
}

/** ハイライト用に分割したテキスト片 */
export interface HighlightSegment {
	text: string;
	start: number;
	end: number;
	/** この片を覆う検出のうち最も重みの大きいもの（覆う検出がなければ null） */
	detection: Detection | null;
	/** この片を覆う検出の件数 */
	overlapCount: number;
}

/**
 * テキストと検出範囲から、重ならない連続した表示片の配列を生成する（純粋関数）。
 * 覆う検出が複数ある場合は最も重みの大きい検出を代表として採用する。
 */
export function buildHighlightSegments(
	text: string,
	detections: readonly Detection[],
): HighlightSegment[] {
	if (text.length === 0) return [];

	const boundaries = new Set<number>([0, text.length]);
	for (const d of detections) {
		if (d.start >= 0 && d.start <= text.length) boundaries.add(d.start);
		if (d.end >= 0 && d.end <= text.length) boundaries.add(d.end);
	}
	const points = [...boundaries].sort((a, b) => a - b);

	const segments: HighlightSegment[] = [];
	for (let i = 0; i < points.length - 1; i++) {
		const start = points[i];
		const end = points[i + 1];
		if (start >= end) continue;

		const covering = detections.filter((d) => d.start <= start && d.end >= end);
		const top = covering.reduce<Detection | null>(
			(best, d) => (best === null || d.weight > best.weight ? d : best),
			null,
		);
		segments.push({
			text: text.slice(start, end),
			start,
			end,
			detection: top,
			overlapCount: covering.length,
		});
	}
	return segments;
}

/** 不可視・制御文字のコードポイント → 表示ラベル */
const INVISIBLE_LABELS: Readonly<Record<number, string>> = {
	8203: 'ZWSP',
	8204: 'ZWNJ',
	8205: 'ZWJ',
	8288: 'WJ',
	65279: 'BOM',
	8234: 'LRE',
	8235: 'RLE',
	8236: 'PDF',
	8237: 'LRO',
	8238: 'RLO',
	8294: 'LRI',
	8295: 'RLI',
	8296: 'FSI',
	8297: 'PDI',
};

/**
 * 不可視・制御文字なら可視ラベル（例: 'ZWSP'）を返す。可視文字なら null。
 * Unicode Tag 文字（U+E0000–E007F）は 'TAG' として扱う。
 */
export function invisibleLabel(char: string): string | null {
	const cp = char.codePointAt(0);
	if (cp === undefined) return null;
	if (cp >= 0xe0000 && cp <= 0xe007f) return 'TAG';
	return INVISIBLE_LABELS[cp] ?? null;
}

/**
 * 文字列中の不可視・制御文字を可視ラベル（例: '⟨ZWSP⟩'）に置換した文字列を返す。
 * 同種の不可視文字が連続する場合は '⟨ZWSP×N⟩' のようにまとめる。
 */
export function visualizeInvisible(text: string): string {
	let out = '';
	let runLabel: string | null = null;
	let runCount = 0;
	const flushRun = () => {
		if (runLabel) {
			out += runCount > 1 ? `⟨${runLabel}×${runCount}⟩` : `⟨${runLabel}⟩`;
			runLabel = null;
			runCount = 0;
		}
	};
	for (const char of text) {
		const label = invisibleLabel(char);
		if (label) {
			if (label === runLabel) {
				runCount += 1;
			} else {
				flushRun();
				runLabel = label;
				runCount = 1;
			}
		} else {
			flushRun();
			out += char;
		}
	}
	flushRun();
	return out;
}
