import fs from 'fs';
import { StorePlugin, calculateChecksum, getPluginsData } from './utils';
import { format } from 'prettier';

function slugify (str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, '-');
}

async function main(name?: string) {
  const plugins: StorePlugin[] = await getPluginsData();

  if (name) {
    const plugin = plugins.find(
      (plugin) =>
        slugify(plugin.name) === slugify(name)
    );

    if (!plugin) {
      throw new Error(`Plugin "${name}" not found in last version`);
    }

    await processPlugin(plugin);
  } else {
    await Promise.all(plugins.map(processPlugin));
  }

  const pluginsJson = JSON.stringify(plugins, null, 2);
  const formattedPluginsJson = format(pluginsJson, { parser: "json" });
  fs.writeFileSync("plugins.json", formattedPluginsJson);
}

async function processPlugin(plugin: StorePlugin) {
  const { assets } = plugin;

  for (const key of Object.keys(assets)) {
    const asset = assets[key];
    asset.checksum = await calculateChecksum(asset.url);
  }
}

const args = process.argv.slice(2);
const allOptionIndex = args.findIndex((arg) => arg === "--all");
const name = allOptionIndex !== -1 ? undefined : args[0];

main(name);
