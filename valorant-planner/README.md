# VAL Strat Planner

個人用の VALORANT 戦術プランニングツール（React + TypeScript + Zustand、描画は SVG）。

```bash
npm install
npm run dev      # 開発サーバ
npm run build    # 型チェック + ビルド
```

- STRATEGY: 10 ステップのシーケンス、音声メモ、ペン/消しゴム/テキスト/画像/軌道線/スタンプ、エージェント配置（ドラッグ or クリック）
- PLAYBOOK: 保存した戦術の一覧 / LINEUPS: ラインナップメモ / MATCHES: 試合・ロードアウト記録 / COMMUNITY: JSON の書き出し・読み込み
- データはブラウザの IndexedDB に自動保存されます（画像・音声含む）。
- マップは自作の概略線画で、実マップの正確なレイアウトではありません。
- ショートカット: Ctrl+Z / Ctrl+Y（元に戻す/やり直し）、Delete（選択中の要素を削除）
