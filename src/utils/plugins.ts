import * as jsonschema from "jsonschema";
import * as jsonfile from "jsonfile";
import fetch from "node-fetch";
import { getManifestContent, pluginStructure, structure } from ".";
import slugify from "slugify";
const semver = require("semver");
const STORE_LIST_URL =
  "https://raw.githubusercontent.com/massalabs/station-store/main/plugins.json";

type Asset = {
  url: string;
  checksum: string;
};

type TypePlugin = {
  name: string;
  author: string;
  logo: string;
  description: string;
  massaStationVersion: string;
  assets: {
    windows: Asset;
    linux: Asset;
    "macos-arm64": Asset;
    "macos-amd64": Asset;
  };
  version: string;
  url: string;
};

export class StorePlugin {
  name: string;
  author: string;
  logo: string;
  description: string;
  massaStationVersion: string;
  assets: {
    windows: Asset;
    linux: Asset;
    "macos-arm64": Asset;
    "macos-amd64": Asset;
  };
  version: string;
  url: string;

  constructor(plugin: TypePlugin) {
    this.name = plugin.name;
    this.author = plugin.author;
    const name_slugified = slugify(plugin.name, { lower: true }); // replace spaces with dashes
    const pluginAssetDirectory = `assets/${name_slugified}`; // replace spaces with dashes
    this.logo = `${pluginAssetDirectory}/${plugin.logo}`;
    this.description = plugin.description;
    this.massaStationVersion = plugin.massaStationVersion;
    this.assets = plugin.assets;
    this.version = plugin.version;
    this.url = plugin.url;
  }

  isFollowingStructure() {
    return jsonschema.validate(this, structure).errors.length == 0;
  }

  async isPluginManifestInAssetFollowingStructure(assetUrl: string) {
    const pluginManifest = await getManifestContent(assetUrl);

    return (
      jsonschema.validate(pluginManifest, pluginStructure).errors.length == 0
    );
  }

  pluginInLastStoreVersion(lastVersion: StorePlugin[]) {
    return lastVersion.find(
      (lastVersionPlugin) => lastVersionPlugin.name === this.name
    );
  }
  getPluginLastVersion(lastVersionPlugins: StorePlugin[]) {
    return lastVersionPlugins.find(
      (lastVersionPlugin) => lastVersionPlugin.name === this.name
    );
  }
  isNewVersionHigher(lastVersionPlugins: StorePlugin[]) {
    let lastVersionPlugin = this.getPluginLastVersion(lastVersionPlugins);
    if (!lastVersionPlugin) {
      throw new Error("Plugin not found in last version");
    }
    return semver.gt(this.version, lastVersionPlugin.version);
  }
}

export async function writePluginsData(plugins: StorePlugin[]) {
  await jsonfile.writeFile("plugins.json", plugins);
}

export async function getPluginsData() {

  return await jsonfile.readFile("plugins.json");
}

export async function getPlugins() {
  const pluginsData: TypePlugin[] = await getPluginsData();
  const lastVersion: StorePlugin[] = await fetch(STORE_LIST_URL).then((res) =>
    res.json()
  );
  const plugins: StorePlugin[] = [];
  for (const plugin of pluginsData) {
    const storePlugin = new StorePlugin(plugin);
    if (storePlugin.isFollowingStructure()) {
      plugins.push(storePlugin);
    } else {
      throw Error(`Invalid plugin object: ${JSON.stringify(plugin)}`);
    }
  }

  let commonPlugins: StorePlugin[] = [];
  let newPlugins: StorePlugin[] = [];
  let updatedPlugins: StorePlugin[] = [];

  plugins.forEach((plugin) => {
    let lastVersionPlugin = lastVersion.find(
      (lastVersionPlugin) => lastVersionPlugin.name === plugin.name
    );

    if (lastVersionPlugin) {
      let isSameVersion = plugin.version === lastVersionPlugin.version;
      if (isSameVersion) {
        commonPlugins.push(plugin);
      } else {
        updatedPlugins.push(plugin);
      }
    } else {
      newPlugins.push(plugin);
    }
  });

  return {
    plugins,
    lastVersion,
    commonPlugins,
    newPlugins,
    updatedPlugins,
  };
}
