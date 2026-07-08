import { RiskScore } from '@/backend/domain/models/risk-score.model';
import { describe, expect, it } from 'vitest';

describe('RiskScore', () => {
	it('重み 0 は score 0・safe', () => {
		const score = RiskScore.fromWeight(0);
		expect(score.value).toBe(0);
		expect(score.level).toBe('safe');
	});

	it('1–49 は caution', () => {
		expect(RiskScore.fromWeight(1).level).toBe('caution');
		expect(RiskScore.fromWeight(30).level).toBe('caution');
		expect(RiskScore.fromWeight(49).level).toBe('caution');
	});

	it('50 以上は danger', () => {
		expect(RiskScore.fromWeight(50).level).toBe('danger');
		expect(RiskScore.fromWeight(80).level).toBe('danger');
	});

	it('100 を超える重みは 100 に丸める', () => {
		const score = RiskScore.fromWeight(150);
		expect(score.value).toBe(100);
		expect(score.level).toBe('danger');
	});

	it('負の重みは 0 に丸める', () => {
		const score = RiskScore.fromWeight(-10);
		expect(score.value).toBe(0);
		expect(score.level).toBe('safe');
	});

	it('小数は四捨五入する', () => {
		expect(RiskScore.fromWeight(49.6).value).toBe(50);
		expect(RiskScore.fromWeight(49.4).value).toBe(49);
	});
});
