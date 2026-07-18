import type { Detection } from '@/backend/presentation/view-models/inspection-view';
import {
	buildHighlightSegments,
	invisibleLabel,
	isDangerWeight,
	visualizeInvisible,
} from '@/frontend/lib/highlight';
import { describe, expect, it } from 'vitest';

function detection(start: number, end: number, weight = 30): Detection {
	return {
		ruleId: `r-${start}-${end}`,
		category: 'instruction-override',
		language: 'any',
		weight,
		description: 'dummy',
		start,
		end,
		value: 'x',
	};
}

describe('buildHighlightSegments', () => {
	it('空テキストは空配列', () => {
		expect(buildHighlightSegments('', [])).toEqual([]);
	});

	it('検出なしは全体を 1 片（detection=null）で返す', () => {
		const segments = buildHighlightSegments('hello', []);
		expect(segments).toHaveLength(1);
		expect(segments[0]).toMatchObject({ text: 'hello', detection: null });
	});

	it('検出範囲を境界にテキストを分割する', () => {
		// "0123456789" の [2,5) を検出
		const segments = buildHighlightSegments('0123456789', [detection(2, 5)]);
		expect(segments.map((s) => s.text)).toEqual(['01', '234', '56789']);
		expect(segments[0].detection).toBeNull();
		expect(segments[1].detection).not.toBeNull();
		expect(segments[2].detection).toBeNull();
	});

	it('重なる検出は最も重みの大きいものを代表にする', () => {
		const segments = buildHighlightSegments('0123456789', [
			detection(0, 10, 20),
			detection(2, 5, 50),
		]);
		const mid = segments.find((s) => s.text === '234');
		expect(mid?.detection?.weight).toBe(50);
		expect(mid?.overlapCount).toBe(2);
	});

	it('複数の重なりでも各区間の代表重みと overlapCount が正しい', () => {
		// [0,8)=w10, [2,6)=w40, [4,10)=w30 の三重なり
		const segments = buildHighlightSegments('0123456789', [
			detection(0, 8, 10),
			detection(2, 6, 40),
			detection(4, 10, 30),
		]);
		const byText = Object.fromEntries(segments.map((s) => [s.text, s]));
		// 境界: 0,2,4,6,8,10 → 区間 [0,2)[2,4)[4,6)[6,8)[8,10)
		expect(byText['01']).toMatchObject({ overlapCount: 1, detection: { weight: 10 } });
		expect(byText['23']).toMatchObject({ overlapCount: 2, detection: { weight: 40 } });
		expect(byText['45']).toMatchObject({ overlapCount: 3, detection: { weight: 40 } });
		expect(byText['67']).toMatchObject({ overlapCount: 2, detection: { weight: 30 } });
		expect(byText['89']).toMatchObject({ overlapCount: 1, detection: { weight: 30 } });
	});

	it('テキスト長を超える検出範囲はクランプして扱う', () => {
		const segments = buildHighlightSegments('01234', [detection(2, 999, 40)]);
		expect(segments.map((s) => s.text)).toEqual(['01', '234']);
		expect(segments[0].detection).toBeNull();
		expect(segments[1].detection?.weight).toBe(40);
	});

	it('重み同点の重なりは元配列で先に来る検出を代表にする（start の前後に依存しない）', () => {
		// 後方 start だが配列で先の A と、前方 start で配列後の B が重なり区間 [5,10) で同点
		const a = { ...detection(5, 10, 50), ruleId: 'A' };
		const b = { ...detection(0, 10, 50), ruleId: 'B' };
		const segments = buildHighlightSegments('0123456789', [a, b]);
		const overlap = segments.find((s) => s.text === '56789');
		expect(overlap?.overlapCount).toBe(2);
		expect(overlap?.detection?.ruleId).toBe('A');
	});
});

describe('invisibleLabel', () => {
	it('ゼロ幅スペースは ZWSP', () => {
		expect(invisibleLabel(String.fromCharCode(0x200b))).toBe('ZWSP');
	});

	it('Tag 文字は TAG', () => {
		expect(invisibleLabel(String.fromCodePoint(0xe0041))).toBe('TAG');
	});

	it('通常文字は null', () => {
		expect(invisibleLabel('a')).toBeNull();
		expect(invisibleLabel('あ')).toBeNull();
	});
});

describe('visualizeInvisible', () => {
	it('不可視文字を可視ラベルに置換する', () => {
		const input = `A${String.fromCharCode(0x200b)}B`;
		expect(visualizeInvisible(input)).toBe('A⟨ZWSP⟩B');
	});

	it('通常文字はそのまま', () => {
		expect(visualizeInvisible('hello')).toBe('hello');
	});

	it('連続する同種の不可視文字はまとめる', () => {
		const zwsp = String.fromCharCode(0x200b);
		expect(visualizeInvisible(`A${zwsp.repeat(3)}B`)).toBe('A⟨ZWSP×3⟩B');
	});
});

describe('isDangerWeight', () => {
	it('45 以上は危険色', () => {
		expect(isDangerWeight(45)).toBe(true);
		expect(isDangerWeight(50)).toBe(true);
	});

	it('45 未満は注意色', () => {
		expect(isDangerWeight(44)).toBe(false);
		expect(isDangerWeight(20)).toBe(false);
	});
});
