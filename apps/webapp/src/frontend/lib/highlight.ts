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
 *
 * 各境界点に「開始／終了する検出」を割り当てて 1 回のスイープで active 集合を更新するため、
 * 検出数 D に対して素朴な O(D²)（境界ごとに全検出を走査）を避けられる。
 * OCR 由来の大量検出でも表示生成でメインスレッドを固めにくくする。
 */
export function buildHighlightSegments(
	text: string,
	detections: readonly Detection[],
): HighlightSegment[] {
	if (text.length === 0) return [];

	const boundaries = new Set<number>([0, text.length]);
	// 各境界点で開始／終了する検出をまとめる（範囲外は [0, text.length] にクランプ）
	const startsAt = new Map<number, Detection[]>();
	const endsAt = new Map<number, Detection[]>();
	// 重み同点時の代表選択を素朴実装（detections 配列順で先着）と一致させるための元配列インデックス
	const order = new Map<Detection, number>();
	detections.forEach((d, i) => order.set(d, i));
	for (const d of detections) {
		const start = Math.max(d.start, 0);
		const end = Math.min(d.end, text.length);
		if (start >= end) continue; // 空・範囲外の検出はどの区間も覆わない
		boundaries.add(start);
		boundaries.add(end);
		(startsAt.get(start) ?? setEmpty(startsAt, start)).push(d);
		(endsAt.get(end) ?? setEmpty(endsAt, end)).push(d);
	}
	const points = [...boundaries].sort((a, b) => a - b);

	const segments: HighlightSegment[] = [];
	const active = new Set<Detection>();
	for (let i = 0; i < points.length - 1; i++) {
		const point = points[i];
		// この点で終了する検出を外し、開始する検出を加える → active が [point, next) を覆う検出
		for (const d of endsAt.get(point) ?? []) active.delete(d);
		for (const d of startsAt.get(point) ?? []) active.add(d);

		const start = point;
		const end = points[i + 1];
		// 覆う検出のうち最大重み、同点は元配列で先に来る検出（Set の反復順に依存しない）
		let top: Detection | null = null;
		for (const d of active) {
			if (top === null || d.weight > top.weight) {
				top = d;
			} else if (d.weight === top.weight && (order.get(d) ?? 0) < (order.get(top) ?? 0)) {
				top = d;
			}
		}
		segments.push({
			text: text.slice(start, end),
			start,
			end,
			detection: top,
			overlapCount: active.size,
		});
	}
	return segments;
}

/** Map に空配列を用意して返す（境界点ごとの検出リスト初期化用） */
function setEmpty(map: Map<number, Detection[]>, key: number): Detection[] {
	const list: Detection[] = [];
	map.set(key, list);
	return list;
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
