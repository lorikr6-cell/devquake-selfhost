import type { PluginDefinition } from './types';

export const PLUGIN_ID_PATTERN = /^[a-z][a-z0-9-]{0,30}[a-z0-9]$/;

/** The key of an admin setting (ADR 0050). */
export const ADMIN_SETTING_KEY = /^[a-z][a-zA-Z0-9]{0,39}$/;

/** Identity helper that validates the definition at load time and gives full type inference. */
export function definePlugin<T extends PluginDefinition>(definition: T): T {
  const { manifest, pages, api } = definition;

  if (!PLUGIN_ID_PATTERN.test(manifest.id)) {
    throw new Error(
      `[plugin-sdk] Invalid plugin id "${manifest.id}". Use lowercase letters, digits and dashes (2-32 chars).`,
    );
  }
  const patterns = [...Object.keys(pages), ...Object.keys(api ?? {})];
  for (const p of patterns) {
    if (!p.startsWith('/')) {
      throw new Error(`[plugin-sdk] Route "${p}" in plugin "${manifest.id}" must start with "/".`);
    }
  }
  const keys = new Set<string>();
  for (const setting of manifest.adminSettings ?? []) {
    if (!ADMIN_SETTING_KEY.test(setting.key) || keys.has(setting.key)) {
      throw new Error(
        `[plugin-sdk] Admin setting "${setting.key}" in plugin "${manifest.id}" must be unique and match ${ADMIN_SETTING_KEY}.`,
      );
    }
    keys.add(setting.key);
  }
  if (!pages['/']) {
    console.warn(`[plugin-sdk] Plugin "${manifest.id}" has no "/" page.`);
  }
  return definition;
}
