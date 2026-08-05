# InfinitePixels

## Codespaces

This repository now includes a devcontainer that automatically provisions required tooling on first Codespace creation and runs a quick self-heal check on startup.

- Installs Hugo Extended 0.164.0
- Installs Haxe, Neko, and haxelib
- Installs OpenFL and Lime via haxelib
- Runs Lime setup (only when needed)
- Installs npm dependencies in site/ (only when missing)

The setup is defined in:

- .devcontainer/devcontainer.json
- .devcontainer/post-create.sh
