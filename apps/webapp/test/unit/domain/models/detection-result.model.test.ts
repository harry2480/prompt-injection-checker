import { DetectionResult, type RawDetection } from '@/backend/domain/models/detection-result.model';
import type { InjectionCategory, InjectionRule } from '@/backend/domain/rules/rule.types';
import { describe, expect, it } from 'vitest';

/** テスト用のダミールール生成 */
function fakeRule(id: string, category: InjectionCategory, weight: number): InjectionRule {
	return {
		id,
		category,
		language: 'any',
		weight,
		description: `dummy ${id}`,
		match: () => [],
	};
}

function raw(rule: InjectionRule, start: number, end: number, value: string): RawDetection {
	return { rule, start, end, value };
}

describe('DetectionResult.from', () => {
	it('検出なしは isEmpty・score 0', () => {
		const result = DetectionResult.from('hello', []);
		expect(result.isEmpty).toBe(true);
		expect(result.detectionCount).toBe(0);
		expect(result.score.value).toBe(0);
		expect(result.score.level).toBe('safe');
	});

	it('検出を開始位置の昇順にソートする', () => {
		const rule = fakeRule('r1', 'instruction-override', 10);
		const input = 'abcdefghij';
		const result = DetectionResult.from(input, [
			raw(rule, 5, 6, 'f'),
			raw(rule, 0, 1, 'a'),
			raw(rule, 2, 3, 'c'),
		]);
		expect(result.detections.map((d) => d.start)).toEqual([0, 2, 5]);
	});

	it('同一開始位置は終了位置の昇順にソートする', () => {
		// 別カテゴリにして重なり統合の対象外にし、純粋にソート順を確認する
		const wide = fakeRule('r1', 'role-change', 10);
		const narrow = fakeRule('r2', 'instruction-override', 10);
		const result = DetectionResult.from('abcdef', [raw(wide, 1, 4, 'bcd'), raw(narrow, 1, 2, 'b')]);
		expect(result.detections.map((d) => d.end)).toEqual([2, 4]);
	});

	it('重みの合計からスコアを算出する', () => {
		const result = DetectionResult.from('x', [
			raw(fakeRule('a', 'instruction-override', 30), 0, 1, 'x'),
			raw(fakeRule('b', 'role-change', 25), 0, 1, 'x'),
		]);
		expect(result.score.value).toBe(55);
		expect(result.score.level).toBe('danger');
	});

	it('ルールのメタ情報を Detection に写す', () => {
		const rule = fakeRule('meta-rule', 'system-prompt-leak', 40);
		const result = DetectionResult.from('input', [raw(rule, 0, 5, 'input')]);
		const d = result.detections[0];
		expect(d.ruleId).toBe('meta-rule');
		expect(d.category).toBe('system-prompt-leak');
		expect(d.weight).toBe(40);
		expect(d.description).toBe('dummy meta-rule');
		expect(d.value).toBe('input');
	});

	it('同一カテゴリで範囲が重なる検出は 1 件にまとめ、スコアを二重計上しない', () => {
		const result = DetectionResult.from('x'.repeat(40), [
			raw(fakeRule('base64', 'encoded-payload', 20), 0, 40, 'x'.repeat(40)),
			raw(fakeRule('hex', 'encoded-payload', 20), 0, 40, 'x'.repeat(40)),
		]);
		expect(result.detectionCount).toBe(1);
		expect(result.score.value).toBe(20);
	});

	it('異なるカテゴリの重なりは両方保持する', () => {
		const result = DetectionResult.from('x'.repeat(10), [
			raw(fakeRule('a', 'encoded-payload', 20), 0, 10, 'x'.repeat(10)),
			raw(fakeRule('b', 'instruction-override', 50), 0, 10, 'x'.repeat(10)),
		]);
		expect(result.detectionCount).toBe(2);
		expect(result.score.value).toBe(70);
	});

	it('重ならない同一カテゴリの検出は別件として保持する', () => {
		const rule = fakeRule('r', 'action-inducement', 20);
		const result = DetectionResult.from('x'.repeat(20), [
			raw(rule, 0, 5, 'xxxxx'),
			raw(rule, 10, 15, 'xxxxx'),
		]);
		expect(result.detectionCount).toBe(2);
		expect(result.score.value).toBe(40);
	});

	it('categorySummary をカテゴリ別に集計し件数降順で返す', () => {
		const result = DetectionResult.from('x', [
			raw(fakeRule('a', 'role-marker-injection', 40), 0, 1, 'x'),
			raw(fakeRule('b', 'instruction-override', 50), 1, 2, 'x'),
			raw(fakeRule('c', 'instruction-override', 20), 2, 3, 'x'),
		]);
		const summary = result.categorySummary();
		expect(summary[0]).toEqual({
			category: 'instruction-override',
			count: 2,
			totalWeight: 70,
		});
		expect(summary[1]).toEqual({
			category: 'role-marker-injection',
			count: 1,
			totalWeight: 40,
		});
	});
});
