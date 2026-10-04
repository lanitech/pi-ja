# pi-ja

Japanese localization pack for the [Pi](https://pi.dev) coding agent.

[日本語](README.md)

![Pi with pi-ja installed](docs/images/after.png)

## What it does

- **Japanese working rules in the system prompt**: replies in Japanese, new code comments in Japanese, commit messages as `fix(scope): <Japanese summary>`, ISO dates. Project `AGENTS.md` files and explicit user instructions take precedence.
- **Japanese UI labels** for everything the extension API exposes: startup header, working message, hidden-thinking label, status line, and a key-binding list.
- **`ja-design-docs` skill** with Japanese templates for requirements, screen lists, and data models.

Slash commands stay in English.

## Install

```bash
pi install npm:@lanitech/pi-ja
```

## Commands

| Command | Description |
| --- | --- |
| `/ja` | Show current state |
| `/ja off` / `/ja on` | Toggle Japanese mode (saved in the session) |
| `/ja keys` | Show key bindings in Japanese |
| `/ja rules` | Show the rules added to the system prompt |

## Screens

| Before | After |
| --- | --- |
| ![default](docs/images/before.png) | ![pi-ja](docs/images/after.png) |

A real response with pi-ja (Japanese explanation, file names untouched, `docs(readme): ...` commit message):

![response](docs/images/response.png)

`/ja keys` shows key bindings in Japanese:

![/ja keys](docs/images/keys.png)

## Limitations

pi-ja does not runtime-patch Pi internals, so built-in menus, command descriptions, and settings screens stay in English. To translate those too, install [pi-di18n](https://www.npmjs.com/package/pi-di18n) alongside it (checked with pi-di18n 0.2.1): pi-di18n handles UI strings, pi-ja handles the agent's working rules and design-doc templates. With both installed, pi-ja's rules, `/ja` command and status line work, but pi-ja's startup header is not shown.

## License

MIT © Lanitech LLC
