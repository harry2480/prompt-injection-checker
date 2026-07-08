import type { Metadata } from 'next';
import { Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const notoSansJP = Noto_Sans_JP({
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
	display: 'swap',
	variable: '--font-noto-sans-jp',
});

export const metadata: Metadata = {
	title: 'プロンプトインジェクション検査',
	description:
		'任意のテキストにプロンプトインジェクションが含まれていないかを、ブラウザ内で検査する静的サイト。入力は外部に送信されません。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja" className={notoSansJP.variable}>
			<body className="font-sans">
				<main className="min-h-screen">
					<div className="mx-auto max-w-3xl px-4 py-8 md:px-8">{children}</div>
				</main>
			</body>
		</html>
	);
}
