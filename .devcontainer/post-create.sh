#!/usr/bin/env bash
set -euo pipefail

HUGO_VERSION="0.164.0"
HUGO_TAR_URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz"

log() {
  echo "[codespace-setup] $1"
}

ensure_apt_prerequisites() {
  if command -v add-apt-repository >/dev/null 2>&1 && command -v wget >/dev/null 2>&1 && command -v java >/dev/null 2>&1 && command -v git-lfs >/dev/null 2>&1 && dpkg -s ca-certificates >/dev/null 2>&1; then
    log "Apt prerequisites already present."
    return
  fi

  log "Preparing apt dependencies..."
  local disabled_yarn_repo=""
  if [[ -f /etc/apt/sources.list.d/yarn.list ]]; then
    disabled_yarn_repo="/etc/apt/sources.list.d/yarn.list.disabled"
    sudo mv /etc/apt/sources.list.d/yarn.list "${disabled_yarn_repo}"
  fi

  trap 'if [[ -n "${disabled_yarn_repo}" && -f "${disabled_yarn_repo}" ]]; then sudo mv "${disabled_yarn_repo}" /etc/apt/sources.list.d/yarn.list; fi' EXIT
  sudo apt-get update
  sudo apt-get install -y software-properties-common wget ca-certificates default-jre-headless git-lfs

  if [[ -n "${disabled_yarn_repo}" && -f "${disabled_yarn_repo}" ]]; then
    sudo mv "${disabled_yarn_repo}" /etc/apt/sources.list.d/yarn.list
  fi
  trap - EXIT
}

ensure_hugo_extended() {
  if command -v hugo >/dev/null 2>&1 && hugo version 2>/dev/null | grep -q "hugo v${HUGO_VERSION}"; then
    log "Hugo Extended v${HUGO_VERSION} already installed."
    return
  fi

  log "Installing Hugo Extended v${HUGO_VERSION}..."
  tmp_dir="$(mktemp -d)"
  tmp_tar="${tmp_dir}/hugo.tar.gz"
  wget -qO "${tmp_tar}" "${HUGO_TAR_URL}"
  tar -xzf "${tmp_tar}" -C "${tmp_dir}"
  sudo mkdir -p /usr/local/hugo/bin
  sudo install -m 0755 "${tmp_dir}/hugo" /usr/local/hugo/bin/hugo
  sudo install -m 0755 "${tmp_dir}/hugo" /usr/local/bin/hugo
  rm -rf "${tmp_dir}"
}

ensure_haxe() {
  if command -v haxe >/dev/null 2>&1; then
    log "Haxe already installed."
    return
  fi

  log "Installing Haxe from official PPA..."
  local disabled_yarn_repo=""
  if [[ -f /etc/apt/sources.list.d/yarn.list ]]; then
    disabled_yarn_repo="/etc/apt/sources.list.d/yarn.list.disabled"
    sudo mv /etc/apt/sources.list.d/yarn.list "${disabled_yarn_repo}"
  fi

  trap 'if [[ -n "${disabled_yarn_repo}" && -f "${disabled_yarn_repo}" ]]; then sudo mv "${disabled_yarn_repo}" /etc/apt/sources.list.d/yarn.list; fi' RETURN
  sudo add-apt-repository ppa:haxe/releases -y
  sudo apt-get update
  sudo apt-get install -y haxe neko

  if [[ -n "${disabled_yarn_repo}" && -f "${disabled_yarn_repo}" ]]; then
    sudo mv "${disabled_yarn_repo}" /etc/apt/sources.list.d/yarn.list
  fi
  trap - RETURN
}

ensure_haxelib_setup() {
  local haxelib_repo
  haxelib_repo="${HOME}/haxelib"
  mkdir -p "${haxelib_repo}"

  if [[ -f "${HOME}/.haxelib" ]]; then
    local configured
    configured="$(cat "${HOME}/.haxelib" || true)"
    if [[ "${configured}" != "${haxelib_repo}" ]]; then
      echo "${haxelib_repo}" > "${HOME}/.haxelib"
      log "Updated .haxelib path to ${haxelib_repo}."
    fi
  else
    haxelib setup "${haxelib_repo}" >/dev/null
    log "Initialized haxelib repository at ${haxelib_repo}."
  fi
}

ensure_haxelib_package() {
  local package_name="$1"
  if haxelib list | grep -q "^${package_name}:"; then
    log "haxelib package ${package_name} already installed."
  else
    log "Installing haxelib package ${package_name}..."
    haxelib install "${package_name}" --quiet
  fi
}

ensure_lime_setup() {
  if haxelib list | grep -q "^hxcpp:"; then
    log "Lime runtime setup already complete."
    return
  fi

  log "Running lime setup..."
  printf 'y\n' | haxelib run lime setup -y
}

install_site_dependencies() {
  if [[ ! -f "site/package.json" ]]; then
    return
  fi

  if [[ -d "site/node_modules" ]]; then
    log "site/ dependencies already installed."
    return
  fi

  log "Installing npm dependencies for site/..."
  npm --prefix site ci
}

main() {
  ensure_apt_prerequisites

  if command -v git-lfs >/dev/null 2>&1; then
    git lfs install --skip-repo >/dev/null 2>&1 || true
  fi

  ensure_hugo_extended
  ensure_haxe
  ensure_haxelib_setup

  ensure_haxelib_package "openfl"
  ensure_haxelib_package "lime"
  ensure_lime_setup
  install_site_dependencies

  log "Codespace setup complete."
}

main "$@"
