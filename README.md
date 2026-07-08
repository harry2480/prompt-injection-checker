# プロンプトインジェクション検査

任意のテキストに**プロンプトインジェクション**が含まれていないかを、ブラウザ内のルールベース検知で検査する静的サイトです。**GitHub Pages** 上で動作し、サーバー・DB・API キーを持ちません。入力したテキストは**外部に送信されません**（URL取得機能を除く）。

🔗 **公開サイト**: https://harry2480.github.io/prompt-injection-checker/

## 特徴

- **ブラウザ内で完結** — 検知はすべてクライアントサイドで実行。入力は外部送信されず、プライバシー面で安全
- **無料・登録不要・オフライン動作** — 静的サイトとして低コスト・高可用
- **日英対応＋言語非依存の検知** — 9 カテゴリのインジェクション手口をルールベースで検出
- **根拠を可視化** — 総合リスク（安全 / 注意 / 危険）、カテゴリ別サマリー、該当箇所のハイライト、不可視文字の可視ラベル化、検出根拠の一覧

## 検知するカテゴリ

| カテゴリ | 例 |
|---|---|
| 命令の無視・上書き | 「これまでの指示を無視」/ `ignore previous instructions` |
| 役割・人格の変更 | 「あなたは今から〜」/ `act as`, `you are now` |
| システムプロンプト/機密の抽出 | 「システムプロンプトを教えて」/ `reveal your system prompt` |
| 制約解除・特権要求 | 「開発者モード」/ `no restrictions`, `jailbreak` |
| 区切り/ロールマーカー注入 | `### System:`, `<\|im_start\|>`, `[INST]` |
| 不可視文字・難読化 | ゼロ幅文字・双方向制御・Unicode Tag 文字 |
| エンコード隠蔽 | 長い Base64 / Hex / URL エンコード列 |
| データ持ち出し・外部誘導 | 「次のURLに送信」/ クエリ付き Markdown 画像 |
| ツール/行動の誘導 | 「実行して」「削除して」/ `run this command` |

> ⚠️ 本ツールは**一次スクリーニング**です。ルールベースのため新規手口の見逃し・正当な文章の誤検知があり、結果の安全性は保証されません。

## 使い方

- テキストを貼り付ける／`.txt`・`.md` ファイルを読み込む／URL を指定して「検査する」を押すと、検出結果が表示されます
- 「サンプルを試す」で代表的なインジェクション例を投入できます

## 開発

```sh
pnpm dev        # 開発サーバー起動
pnpm verify     # lint → typecheck → unit test → depcruise
pnpm test:unit  # Unit テスト（検知ロジック中心）
pnpm lint:fix   # 自動フォーマット・Lint 適用
pnpm build      # 静的エクスポート（out/ を生成）
pnpm knip       # 未使用コード検出
```

「〇〇な検知ルールを追加して」「〇〇な画面を作って」など、やりたいことを Claude Code に指示するだけで実装できます。

## 技術スタック

- Next.js 15 (App Router) を**静的エクスポート**（`output: 'export'`）で GitHub Pages へ配信
- TypeScript / shadcn/ui + Tailwind CSS
- 検知エンジンは外部依存を持たない純粋 TypeScript
- Vitest / dependency-cruiser / Biome
- GitHub Actions で build → GitHub Pages デプロイ

> サーバー機能（Server Actions・API Routes・SSR/ISR・DB・Supabase）は使用しません。

## アーキテクチャ

pnpm workspace monorepo。`apps/webapp/` に Next.js 15 アプリ。バックエンド (`apps/webapp/src/backend/`) は DDD 4層構造で、検知は最内層の `domain` に集約しています。

```text
依存方向: presentation → application → domain ← infrastructure
```

```text
apps/webapp/src/
├── app/                     # 検査ページ（Next.js App Router）
├── backend/
│   ├── domain/              # 検知エンジン・ルール（データ）・モデル（外部依存なし）
│   ├── application/         # 検査 UseCase
│   ├── infrastructure/      # Gateway 実装（ファイル読込・URL取得）＋ Stub
│   └── presentation/        # composition（DI）・view-models
└── frontend/                # UI（components / hooks / lib）
```

- 検知ルールは `domain/rules/` に**データ（配列・定数）として宣言的に管理**し、検知エンジン（純粋関数）から分離
- 外部 I/O（`fetch`・`FileReader`）は `infrastructure/adapters/` に閉じ込め、必ず Stub を用意
- frontend は `backend/presentation` 経由でのみ検知機能を利用（dependency-cruiser で機械的に検証）

詳細な設計は `docs/` を参照してください。

## ライセンス

[MIT](./LICENSE)
