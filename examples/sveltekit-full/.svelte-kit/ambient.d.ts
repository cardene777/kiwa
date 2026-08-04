
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const MANPATH: string;
	export const CMUX_BUNDLED_CLI_PATH: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const __MISE_DIFF: string;
	export const GHOSTTY_RESOURCES_DIR: string;
	export const CMUX_CLAUDE_WRAPPER_SHIM_ROOT: string;
	export const CLAUDE_EFFORT: string;
	export const CMUX_SHELL_INTEGRATION_DIR: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const TERM_PROGRAM: string;
	export const CMUX_NO_PR_WATCH: string;
	export const GHOSTTY_SURFACE_ID: string;
	export const NODE: string;
	export const CLAUDE_CODE_BRIDGE_SESSION_ID: string;
	export const CMUX_CODEX_WRAPPER_SHIM: string;
	export const INIT_CWD: string;
	export const SHELL: string;
	export const CMUX_BUNDLE_ID: string;
	export const TERM: string;
	export const CLAUDE_CODE_CHILD_SESSION: string;
	export const CLAUDE_PID: string;
	export const CMUX_PANEL_ID: string;
	export const TMPDIR: string;
	export const HOMEBREW_REPOSITORY: string;
	export const CMUX_SOCKET: string;
	export const TERM_PROGRAM_VERSION: string;
	export const npm_config_npm_globalconfig: string;
	export const FPATH: string;
	export const CMUX_SOCKET_CAPABILITY: string;
	export const npm_config_registry: string;
	export const PNPM_HOME: string;
	export const AI_AGENT: string;
	export const GIT_EDITOR: string;
	export const USER: string;
	export const COMMAND_MODE: string;
	export const npm_config_globalconfig: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const CLAUDE_CODE_NO_FLICKER: string;
	export const ENABLE_TOOL_SEARCH: string;
	export const SSH_AUTH_SOCK: string;
	export const CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
	export const CMUX_SUPPRESS_SUBAGENT_NOTIFICATIONS: string;
	export const CMUX_AGENT_LAUNCH_ARGV_B64: string;
	export const __CF_USER_TEXT_ENCODING: string;
	export const npm_execpath: string;
	export const CLAUDE_CODE_MAX_TURNS_SUBAGENT: string;
	export const CMUX_AGENT_LAUNCH_CWD: string;
	export const npm_config_frozen_lockfile: string;
	export const npm_config_verify_deps_before_run: string;
	export const PATH: string;
	export const CARGO_HOME: string;
	export const CMUX_PORT: string;
	export const LaunchInstanceID: string;
	export const GHOSTTY_SHELL_FEATURES: string;
	export const npm_package_json: string;
	export const __CFBundleIdentifier: string;
	export const CMUX_CLAUDE_HOOK_CMUX_BIN: string;
	export const PWD: string;
	export const CMUX_PORT_END: string;
	export const npm_command: string;
	export const CMUX_NO_GIT_WATCH: string;
	export const EDITOR: string;
	export const CMUX_WORKSPACE_ID: string;
	export const CMUX_SHELL_INTEGRATION: string;
	export const npm_config__jsr_registry: string;
	export const npm_lifecycle_event: string;
	export const LANG: string;
	export const npm_package_name: string;
	export const CLAUDE_CLIENT_PRESENCE_FILE: string;
	export const npm_config_script_shell: string;
	export const NODE_PATH: string;
	export const npm_config_block_exotic_subdeps: string;
	export const XPC_FLAGS: string;
	export const npm_config_minimum_release_age: string;
	export const CMUX_CODEX_WRAPPER_SHIM_ROOT: string;
	export const CMUX_KIRO_NOTIFICATION_LEVEL: string;
	export const RUSTUP_TOOLCHAIN: string;
	export const CMUX_LOAD_GHOSTTY_ZSH_INTEGRATION: string;
	export const npm_config_node_gyp: string;
	export const XPC_SERVICE_NAME: string;
	export const npm_package_version: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const CMUX_TAB_ID: string;
	export const HOME: string;
	export const SHLVL: string;
	export const CMUX_CLAUDE_PID: string;
	export const __MISE_ORIG_PATH: string;
	export const TERMINFO: string;
	export const CLAUDE_CODE_EXECPATH: string;
	export const HOMEBREW_PREFIX: string;
	export const RUSTUP_HOME: string;
	export const CMUX_PORT_RANGE: string;
	export const MISE_SHELL: string;
	export const LOGNAME: string;
	export const __MISE_ZSH_CHPWD_RAN: string;
	export const npm_lifecycle_script: string;
	export const XDG_DATA_DIRS: string;
	export const CODEX_COMPANION_SESSION_ID: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const npm_config_user_agent: string;
	export const CLAUDE_CODE_SESSION_ID: string;
	export const CMUX_SOCKET_PATH: string;
	export const INFOPATH: string;
	export const HOMEBREW_CELLAR: string;
	export const __MISE_SESSION: string;
	export const GHOSTTY_BIN: string;
	export const CMUX_AGENT_LAUNCH_KIND: string;
	export const npm_config_overrides: string;
	export const OSLogRateLimit: string;
	export const CLAUDE_PLUGIN_DATA: string;
	export const CMUX_CLAUDE_WRAPPER_SHIM: string;
	export const CMUX_AGENT_LAUNCH_EXECUTABLE: string;
	export const CMUX_SURFACE_ID: string;
	export const CLAUDECODE: string;
	export const SECURITYSESSIONID: string;
	export const CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: string;
	export const __MISE_ZSH_PRECMD_RUN: string;
	export const COLORTERM: string;
	export const npm_node_execpath: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		MANPATH: string;
		CMUX_BUNDLED_CLI_PATH: string;
		NoDefaultCurrentDirectoryInExePath: string;
		__MISE_DIFF: string;
		GHOSTTY_RESOURCES_DIR: string;
		CMUX_CLAUDE_WRAPPER_SHIM_ROOT: string;
		CLAUDE_EFFORT: string;
		CMUX_SHELL_INTEGRATION_DIR: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		TERM_PROGRAM: string;
		CMUX_NO_PR_WATCH: string;
		GHOSTTY_SURFACE_ID: string;
		NODE: string;
		CLAUDE_CODE_BRIDGE_SESSION_ID: string;
		CMUX_CODEX_WRAPPER_SHIM: string;
		INIT_CWD: string;
		SHELL: string;
		CMUX_BUNDLE_ID: string;
		TERM: string;
		CLAUDE_CODE_CHILD_SESSION: string;
		CLAUDE_PID: string;
		CMUX_PANEL_ID: string;
		TMPDIR: string;
		HOMEBREW_REPOSITORY: string;
		CMUX_SOCKET: string;
		TERM_PROGRAM_VERSION: string;
		npm_config_npm_globalconfig: string;
		FPATH: string;
		CMUX_SOCKET_CAPABILITY: string;
		npm_config_registry: string;
		PNPM_HOME: string;
		AI_AGENT: string;
		GIT_EDITOR: string;
		USER: string;
		COMMAND_MODE: string;
		npm_config_globalconfig: string;
		PNPM_SCRIPT_SRC_DIR: string;
		CLAUDE_CODE_NO_FLICKER: string;
		ENABLE_TOOL_SEARCH: string;
		SSH_AUTH_SOCK: string;
		CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
		CMUX_SUPPRESS_SUBAGENT_NOTIFICATIONS: string;
		CMUX_AGENT_LAUNCH_ARGV_B64: string;
		__CF_USER_TEXT_ENCODING: string;
		npm_execpath: string;
		CLAUDE_CODE_MAX_TURNS_SUBAGENT: string;
		CMUX_AGENT_LAUNCH_CWD: string;
		npm_config_frozen_lockfile: string;
		npm_config_verify_deps_before_run: string;
		PATH: string;
		CARGO_HOME: string;
		CMUX_PORT: string;
		LaunchInstanceID: string;
		GHOSTTY_SHELL_FEATURES: string;
		npm_package_json: string;
		__CFBundleIdentifier: string;
		CMUX_CLAUDE_HOOK_CMUX_BIN: string;
		PWD: string;
		CMUX_PORT_END: string;
		npm_command: string;
		CMUX_NO_GIT_WATCH: string;
		EDITOR: string;
		CMUX_WORKSPACE_ID: string;
		CMUX_SHELL_INTEGRATION: string;
		npm_config__jsr_registry: string;
		npm_lifecycle_event: string;
		LANG: string;
		npm_package_name: string;
		CLAUDE_CLIENT_PRESENCE_FILE: string;
		npm_config_script_shell: string;
		NODE_PATH: string;
		npm_config_block_exotic_subdeps: string;
		XPC_FLAGS: string;
		npm_config_minimum_release_age: string;
		CMUX_CODEX_WRAPPER_SHIM_ROOT: string;
		CMUX_KIRO_NOTIFICATION_LEVEL: string;
		RUSTUP_TOOLCHAIN: string;
		CMUX_LOAD_GHOSTTY_ZSH_INTEGRATION: string;
		npm_config_node_gyp: string;
		XPC_SERVICE_NAME: string;
		npm_package_version: string;
		pnpm_config_verify_deps_before_run: string;
		CMUX_TAB_ID: string;
		HOME: string;
		SHLVL: string;
		CMUX_CLAUDE_PID: string;
		__MISE_ORIG_PATH: string;
		TERMINFO: string;
		CLAUDE_CODE_EXECPATH: string;
		HOMEBREW_PREFIX: string;
		RUSTUP_HOME: string;
		CMUX_PORT_RANGE: string;
		MISE_SHELL: string;
		LOGNAME: string;
		__MISE_ZSH_CHPWD_RAN: string;
		npm_lifecycle_script: string;
		XDG_DATA_DIRS: string;
		CODEX_COMPANION_SESSION_ID: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		npm_config_user_agent: string;
		CLAUDE_CODE_SESSION_ID: string;
		CMUX_SOCKET_PATH: string;
		INFOPATH: string;
		HOMEBREW_CELLAR: string;
		__MISE_SESSION: string;
		GHOSTTY_BIN: string;
		CMUX_AGENT_LAUNCH_KIND: string;
		npm_config_overrides: string;
		OSLogRateLimit: string;
		CLAUDE_PLUGIN_DATA: string;
		CMUX_CLAUDE_WRAPPER_SHIM: string;
		CMUX_AGENT_LAUNCH_EXECUTABLE: string;
		CMUX_SURFACE_ID: string;
		CLAUDECODE: string;
		SECURITYSESSIONID: string;
		CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: string;
		__MISE_ZSH_PRECMD_RUN: string;
		COLORTERM: string;
		npm_node_execpath: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
