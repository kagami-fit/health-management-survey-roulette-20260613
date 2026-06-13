# Apps Script 設定手順

## 目的

この `gas/Code.gs` は、アンケート回答をGoogleスプレッドシートへ1行ずつ追記するための受け口です。

回答保存先:
https://docs.google.com/spreadsheets/d/1_fXSygfLuhT0UCuvtqKu1BlDCvCj0rfdC42onWZ2LEI/edit

## 設定手順

1. Google Apps Scriptで新規プロジェクトを作成します。
2. `Code.gs` の内容を貼り付けます。
3. `appsscript.json` を表示し、このフォルダの `appsscript.json` と同じ内容にします。
4. 右上の「デプロイ」から「新しいデプロイ」を選びます。
5. 種類は「ウェブアプリ」を選びます。
6. 実行ユーザーは「自分」、アクセスできるユーザーは「全員」にします。
7. デプロイ後に表示されるWebアプリURLをコピーします。
8. サイト側の `app.js` 先頭にある `SHEET_WEB_APP_URL` へ貼り付けます。

```js
const SHEET_WEB_APP_URL = "https://script.google.com/macros/s/....../exec";
```

## 現在の設定

このプロジェクトでは、次のWebアプリURLを `app.js` に設定済みです。

```text
https://script.google.com/macros/s/AKfycbzTVtAxa3YyQXKK9ThnJ_sRWGl-e3GbpGk4VE4b3liZ17S1whFoEGe-_hlrOzsQUatg/exec
```

## 注意

- 公開サイトから送信するため、WebアプリURLを知っている人は送信できます。
- 入力項目は、名前・会社名・メールアドレスの3つです。
- スマホからメールアドレスを完全自動取得することはできません。サイト側では `autocomplete="email"` を設定しているため、端末に保存されたメール候補をタップ入力できます。
