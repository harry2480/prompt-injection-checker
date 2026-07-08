import { InspectTextUseCase } from '../../application/usecases/inspect-text.usecase';
import { enRules } from '../../domain/rules/en-rules';
import { jaRules } from '../../domain/rules/ja-rules';
import { structuralRules } from '../../domain/rules/structural-rules';
import { InjectionDetectorService } from '../../domain/services/injection-detector.service';
import { BrowserContentSourceAdapter } from '../../infrastructure/adapters/browser-content-source.adapter';

/**
 * 検査機能の Composition Root（唯一の DI ポイント）。
 * frontend はこのファクトリ経由でのみ検知機能を利用する。
 */
export function createInspectTextUseCase(): InspectTextUseCase {
	const detector = new InjectionDetectorService([...jaRules, ...enRules, ...structuralRules]);
	const contentSource = new BrowserContentSourceAdapter();
	return new InspectTextUseCase(detector, contentSource);
}
