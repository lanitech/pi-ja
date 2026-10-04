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

`/ja keys` shows key bindings in Japanese:

![/ja keys](docs/images/keys.png)

## Limitations

Built-in menus, command descriptions, and settings screens cannot be replaced through the extension API and remain in English.

## License

MIT © Lanitech LLC
