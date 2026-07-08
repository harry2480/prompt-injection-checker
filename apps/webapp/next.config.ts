import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// GitHub Pages のプロジェクトページ配信用サブパス。
// CI（デプロイワークフロー）で NEXT_PUBLIC_BASE_PATH を設定する。
// ローカル開発では未設定（ルート配信）。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
	// GitHub Pages への静的エクスポート（サーバー機能を使わない）
	output: 'export',
	// 環境上の別リポジトリの lockfile を誤ってワークスペースルートに推定しないよう明示する
	outputFileTracingRoot: path.join(__dirname, '../..'),
	// 静的エクスポートでは next/image の最適化サーバーを使えない
	images: { unoptimized: true },
	// サブパス配信時のみ有効化
	basePath: basePath || undefined,
	assetPrefix: basePath || undefined,
	// GitHub Pages のディレクトリ index.html 解決を安定させる
	trailingSlash: true,
};

export default nextConfig;
