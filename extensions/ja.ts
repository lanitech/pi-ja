/**
 * pi-ja: Pi coding agent 日本語化拡張
 *
 * やること
 * 1. システムプロンプトに日本語で作業するためのルールを足す（before_agent_start）
 * 2. 拡張から変えられる画面表示を日本語にする（作業中の表示・思考ラベル・起動ヘッダー・ステータス行）
 * 3. `/ja` コマンドでオン/オフと操作一覧の表示を切り替える
 *
 * ⚠ Pi 本体のメニューやヘルプの文言は拡張 API からは置き換えられない。
 *   ここで日本語にしているのは ctx.ui が公開している表示だけ。
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { keyHint, keyText, rawKeyHint, VERSION } from "@earendil-works/pi-coding-agent";
import { truncateToWidth } from "@earendil-works/pi-tui";

/** systemPromptOptions.sections に入れるキー。Pi はこのキー名の XML タグで包んでモデルに渡す */
const SECTION_KEY = "japanese_language";
/** セッションに状態を残すときの customType */
const ENTRY_TYPE = "pi-ja";
const STATUS_KEY = "pi-ja";

/**
 * 日本語で作業するためのルール。
 * ⚠ プロジェクトの AGENTS.md やユーザーの指示と衝突したら、そちらを優先させる。
 *   日本語化パックが既存プロジェクトの規約を上書きしてしまう事故を避けるため。
 */
export const JAPANESE_RULES = `ユーザーとのやりとりは日本語で行います。次のルールに従ってください。

## 応答
- 回答・説明・質問・作業報告は日本語で書く。
- 文体は「です・ます」調。前置き、謝罪の定型句、依頼内容の復唱は省き、結論から書く。
- 関数名・変数名・ファイルパス・コマンド・エラーメッセージ・ログは原文のまま書き、訳さない。
- 技術用語は無理に和訳しない（例: デプロイ、リポジトリ、プルリクエスト）。

## コード
- 識別子（変数名・関数名・型名）は英語で付ける。
- 新しく書くコメントは日本語で、「何をしているか」より「なぜそうしたか」を書く。
- 既存ファイルのコメントが英語なら、そのファイルでは英語に合わせる。
- ユーザーに見せる文言（UI のラベル、エラーメッセージ）は、プロジェクトの既存の言語に合わせる。

## コミットメッセージ
- リポジトリの履歴に規約があればそれに従う。
- 規約がなければ Conventional Commits 形式で、型は英語・要約は日本語にする（例: \`fix(auth): ログイン後にリダイレクトされない問題を修正\`）。
- 本文が必要なときは「原因」「対処」を日本語で書く。

## ドキュメント
- 設計書・README・仕様書は日本語で書く。日本語の設計書を作るときは ja-design-docs スキルの雛形を使う。
- 日付は YYYY-MM-DD 形式。英数字は半角で書く。

## 優先順位
- プロジェクトの AGENTS.md / CLAUDE.md や、ユーザーが明示した指示がこのルールと違う場合は、そちらを優先する。
- ユーザーが英語で話しかけた場合は英語で答えてよい。`;

/** 起動ヘッダーの短い操作ヒント（1 行） */
function compactHints(): string {
	return [
		keyHint("app.interrupt", "中断"),
		rawKeyHint(`${keyText("app.clear")}/${keyText("app.exit")}`, "クリア/終了"),
		rawKeyHint("/", "コマンド"),
		rawKeyHint("!", "bash 実行"),
	].join("  ");
}

/**
 * 操作の一覧。本体の起動ヘッダーの展開表示と同じ項目を日本語にしたもの。
 * ⚠ キー表示は keyText() でユーザーのキー設定から引くので、キーを変えていても正しく出る。
 */
function fullHints(): string[] {
	// 選択ダイアログに渡すので色は付けず、「キー  説明」のプレーンテキストにする
	const row = (key: string, label: string) => `${key}  ${label}`;
	return [
		row(keyText("app.interrupt"), "中断"),
		row(keyText("app.clear"), "入力をクリア"),
		row(`${keyText("app.clear")} を 2 回`, "終了"),
		row(keyText("app.exit"), "終了（入力が空のとき）"),
		row(keyText("app.suspend"), "一時停止"),
		row(keyText("tui.editor.deleteToLineEnd"), "行末まで削除"),
		row(keyText("app.thinking.cycle"), "思考レベルの切り替え"),
		row(`${keyText("app.model.cycleForward")}/${keyText("app.model.cycleBackward")}`, "モデルの切り替え"),
		row(keyText("app.model.select"), "モデルを選ぶ"),
		row(keyText("app.tools.expand"), "ツール出力を展開"),
		row(keyText("app.thinking.toggle"), "思考を展開"),
		row(keyText("app.editor.external"), "外部エディタで編集"),
		row("/", "コマンド"),
		row("!", "bash を実行"),
		row("!!", "bash を実行（会話に含めない）"),
		row(keyText("app.message.followUp"), "続きの指示を予約"),
		row(keyText("app.message.dequeue"), "予約した指示をまとめて編集"),
		row(keyText("app.clipboard.pasteImage"), "ファイル・画像・テキストを貼り付け"),
		row("ファイルをドロップ", "添付"),
	];
}

export default function piJa(pi: ExtensionAPI) {
	let enabled = true;

	/** 拡張が変えられる画面表示を日本語にする。オフのときは本体の表示に戻す */
	const applyUi = (ctx: ExtensionContext) => {
		if (!ctx.hasUI) return;
		if (!enabled) {
			ctx.ui.setWorkingMessage();
			ctx.ui.setHiddenThinkingLabel();
			ctx.ui.setStatus(STATUS_KEY, undefined);
			if (ctx.mode === "tui") ctx.ui.setHeader(undefined);
			return;
		}
		ctx.ui.setWorkingMessage(`作業中（${keyText("app.interrupt")} で中断）`);
		ctx.ui.setHiddenThinkingLabel("思考中...");
		ctx.ui.setStatus(STATUS_KEY, "日本語");
		if (ctx.mode === "tui") {
			ctx.ui.setHeader((_tui, theme) => ({
				render(width: number): string[] {
					const lines = [
						`${theme.fg("accent", "pi")} ${theme.fg("dim", `v${VERSION}`)} ${theme.fg("muted", "日本語モード（pi-ja）")}`,
						compactHints(),
						theme.fg("dim", "操作の一覧は /ja keys、日本語モードのオフは /ja off"),
					];
					return lines.map((line) => truncateToWidth(line, width));
				},
				invalidate() {},
			}));
		}
	};

	/** セッションの履歴から最後の /ja on|off を読み戻す（ブランチごとに正しい状態になる） */
	const restoreState = (ctx: ExtensionContext) => {
		enabled = true;
		for (const entry of ctx.sessionManager.getBranch()) {
			if (entry.type === "custom" && entry.customType === ENTRY_TYPE) {
				const data = entry.data as { enabled?: boolean } | undefined;
				if (typeof data?.enabled === "boolean") enabled = data.enabled;
			}
		}
	};

	pi.on("session_start", async (_event, ctx) => {
		restoreState(ctx);
		applyUi(ctx);
	});

	// ⚠ systemPrompt を丸ごと返すと他の拡張の変更や transcript の差分記録を壊すので、
	//   sections にキーを 1 つ足すだけにする。
	pi.on("before_agent_start", (event) => {
		if (enabled) {
			event.systemPromptOptions.sections[SECTION_KEY] = JAPANESE_RULES;
		} else {
			delete event.systemPromptOptions.sections[SECTION_KEY];
		}
	});

	pi.registerCommand("ja", {
		description: "Japanese mode: /ja [on|off|keys|rules]",
		handler: async (args, ctx) => {
			const sub = args.trim().toLowerCase();

			if (sub === "on" || sub === "off") {
				enabled = sub === "on";
				pi.appendEntry(ENTRY_TYPE, { enabled });
				applyUi(ctx);
				ctx.ui.notify(enabled ? "日本語モードをオンにしました" : "日本語モードをオフにしました", "info");
				return;
			}

			if (sub === "keys") {
				// ⚠ ウィジェットは最大 10 行で切られるため、スクロールできる選択ダイアログで一覧を出す（Esc で閉じる）
				await ctx.ui.select("操作の一覧（Esc で閉じる）", fullHints());
				return;
			}

			if (sub === "rules") {
				// ルール本文はエディタで読み取り専用の確認用に開く（編集しても反映はしない）
				await ctx.ui.editor("pi-ja がシステムプロンプトに足しているルール", JAPANESE_RULES);
				return;
			}

			ctx.ui.notify(
				`日本語モード: ${enabled ? "オン" : "オフ"}\n/ja on・/ja off で切り替え、/ja keys で操作一覧、/ja rules で追加ルールを表示`,
				"info",
			);
		},
	});
}
