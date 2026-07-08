import { Card, CardContent, CardHeader, CardTitle } from '@/frontend/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export default function HomePage() {
	return (
		<div className="space-y-8">
			<div className="space-y-3">
				<h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
					<ShieldCheck className="h-7 w-7 text-primary" />
					プロンプトインジェクション検査
				</h1>
				<p className="text-muted-foreground">
					任意のテキストにプロンプトインジェクションが含まれていないかを、ブラウザ内のルールベース検知で検査します。
					入力は外部に送信されません（URL取得を除く）。
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">準備中</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						検査機能は現在実装中です。今後のフェーズで、テキスト・ファイル・URL
						からの入力と検知結果の表示に対応します。
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
