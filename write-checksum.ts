import fs from 'fs';
import slugify from 'slugify';
import { StorePlugin, calculateChecksum, getPluginsData } from './tests/utils';
import { format } from 'prettier';

async function main(name?: string) {
  const plugins: StorePlugin[] = await getPluginsData();
  
  if (name) {
    const plugin = plugins.find(
      (plugin) =>
        slugify(plugin.name, { lower: true }) === slugify(name, { lower: true })
    );
  
    if (!plugin) {
      throw new Error(`Plugin "${name}" not found in last version`);
    }
  
    await processPlugin(plugin);
  } else {
    await Promise.all(plugins.map(processPlugin));
  }

  const pluginsJson = JSON.stringify(plugins, null, 2);
  const formattedPluginsJson = format(pluginsJson, { parser: 'json' });
  fs.writeFileSync('plugins.json', formattedPluginsJson);
}

async function processPlugin(plugin: StorePlugin) {
  const { assets } = plugin;
  await Promise.all(
    Object.keys(assets).map(async (key) => {
      const asset = assets[key];
      const checksum = await calculateChecksum(asset.url);
      plugin.assets[key].checksum = checksum;
    })
  );
}

const args = process.argv.slice(2);
const allOptionIndex = args.findIndex(arg => arg === '--all');
const name = allOptionIndex !== -1 ? undefined : args[0];

main(name);
