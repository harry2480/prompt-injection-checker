'use client';

import type { Detection } from '@/backend/presentation/view-models/inspection-view';
import {
	type HighlightSegment,
	buildHighlightSegments,
	invisibleLabel,
	isDangerWeight,
} from '@/frontend/lib/highlight';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface HighlightedTextProps {
	text: string;
	detections: readonly Detection[];
}

/** 描画トークン: 通常テキスト or 連続する同種の不可視文字（件数付き） */
type RenderToken =
	| { type: 'text'; value: string }
	| { type: 'invisible'; label: string; count: number };

/** 検出の重みからハイライトのトーン（危険度）を決める */
function toneClass(detection: Detection): string {
	return isDangerWeight(detection.weight)
		? 'bg-destructive-bg text-destructive'
		: 'bg-warning-bg text-warning';
}

/**
 * 文字列を描画トークン列に分解する。
 * 連続する同種の不可視文字は 1 トークンに畳み、大量の不可視文字でも DOM が肥大化しないようにする。
 */
function tokenize(text: string): RenderToken[] {
	const tokens: RenderToken[] = [];
	let buffer = '';
	const flush = () => {
		if (buffer) {
			tokens.push({ type: 'text', value: buffer });
			buffer = '';
		}
	};
	for (const char of text) {
		const label = invisibleLabel(char);
		if (label) {
			flush();
			const last = tokens[tokens.length - 1];
			if (last && last.type === 'invisible' && last.label === label) {
				last.count += 1;
			} else {
				tokens.push({ type: 'invisible', label, count: 1 });
			}
		} else {
			buffer += char;
		}
	}
	flush();
	return tokens;
}

/** 不可視文字を可視ラベルに置換しつつ文字列をノード列にする */
function renderChars(text: string, keyPrefix: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	// トークン先頭のオフセットを安定した key に使う（配列インデックス key を避ける）
	let offset = 0;
	for (const token of tokenize(text)) {
		if (token.type === 'text') {
			nodes.push(<span key={`${keyPrefix}-t${offset}`}>{token.value}</span>);
			offset += token.value.length;
		} else {
			const suffix = token.count > 1 ? `×${token.count}` : '';
			nodes.push(
				<span
					key={`${keyPrefix}-i${offset}`}
					className="mx-0.5 inline-flex items-center rounded bg-destructive px-1 align-middle text-[10px] font-bold text-white"
					title={`不可視/制御文字: ${token.label}${token.count > 1 ? `（${token.count} 個連続）` : ''}`}
				>
					⟨{token.label}
					{suffix}⟩
				</span>,
			);
			offset += token.count;
		}
	}
	return nodes;
}

function renderSegment(segment: HighlightSegment, key: number): ReactNode {
	const content = renderChars(segment.text, `seg${key}`);
	if (segment.detection === null) {
		return <span key={key}>{content}</span>;
	}
	const title =
		segment.overlapCount > 1
			? `${segment.detection.description}（他 ${segment.overlapCount - 1} 件の検出と重複）`
			: segment.detection.description;
	return (
		<mark key={key} className={cn('rounded px-0.5', toneClass(segment.detection))} title={title}>
			{content}
		</mark>
	);
}

/**
 * 入力テキストを、検出箇所のハイライトと不可視文字の可視ラベル付きで表示する。
 */
export function HighlightedText({ text, detections }: HighlightedTextProps) {
	const segments = buildHighlightSegments(text, detections);
	return (
		<p className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed">
			{segments.map((segment, i) => renderSegment(segment, i))}
		</p>
	);
}
