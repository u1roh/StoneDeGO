# StoneDeGO

TypeScript で作った、12×12 の陣取りゲームです。ブラウザーだけで動作する静的サイトです。

## 遊び方

- `index.html` を開き、「コンピュータと対戦」または「人同士で対戦」を選びます。
- 80 手終了時に、赤と青の陣地の広さを比べます。

## GitHub Pages

このリポジトリには GitHub Actions の Pages デプロイ設定があります。GitHub の **Settings → Pages → Build and deployment** で **GitHub Actions** を選び、`master` に push すると自動で公開されます。

公開 URL は通常 `https://<アカウント名>.github.io/StoneDeGO/` です。TypeScript を変更した場合は、JavaScript を再生成して `app.js` も一緒に commit してください。

## JavaScript の再生成

TypeScript 5 以降を使って、次のコマンドで `app.js` を生成できます。

```sh
npx --yes --package typescript tsc app.ts --target ES2015 --lib DOM,ES2015 --outDir . --skipLibCheck --strictNullChecks false --noImplicitAny false
```
