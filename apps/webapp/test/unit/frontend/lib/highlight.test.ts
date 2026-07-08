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
