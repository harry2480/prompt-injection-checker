import { CATEGORY_METADATA } from '@/backend/presentation/view-models/inspection-view';
import { InjectionInspector } from '@/frontend/components/inspection/injection-inspector';
import { Card, CardContent } from '@/frontend/components/ui/card';
import { Info, ShieldCheck } from 'lucide-react';

const CATEGORIES = Object.values(CATEGORY_METADATA);

export default function HomePage() {
	return (
		<div className="space-y-8">
			{/* ヘッダー */}
			<header className="space-y-3">
				<h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
					<ShieldCheck className="h-7 w-7 text-primary" aria-hidden />
					プロンプトインジェクション検査
				</h1>
				<p className="text-muted-foreground">
					任意のテキストにプロンプトインジェクションが含まれていないかを、ブラウザ内のルールベース検知で検査します。
					入力は外部に送信されません（URL取得を除く）。
				</p>
			</header>

			{/* 免責 */}
			<div className="flex items-start gap-2 rounded-card border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
				<Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
				<p>
					本ツールは一次スクリーニングです。ルールベースのため
					<strong>新規手口の見逃し・正当な文章の誤検知</strong>
					があり、結果の安全性は保証されません。
				</p>
			</div>

			{/* 検査 */}
			<InjectionInspector />

			{/* 検知カテゴリ一覧 */}
			<section aria-label="検知カテゴリ" className="space-y-3">
				<h2 className="text-lg font-semibold text-foreground">検知するカテゴリ</h2>
				<div className="grid gap-3 sm:grid-cols-2">
					{CATEGORIES.map((c) => (
						<Card key={c.label}>
							<CardContent className="space-y-1 py-4">
								<h3 className="text-sm font-semibold text-foreground">{c.label}</h3>
								<p className="text-sm text-muted-foreground">{c.summary}</p>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
		</div>
	);
}
