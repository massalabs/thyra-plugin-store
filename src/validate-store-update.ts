import {
  getPlugins,
  IMAGE_FORMATS,
  checkFileChecksum,
  getZipFileList,
  getImageDimensions,
  StorePlugin,
} from "./utils";

const patterns = {
  windows: /^[a-zA-Z0-9]+\.exe$/,
  linux: /^[a-zA-Z0-9]+$/,
  "macos-amd64": /^[a-zA-Z0-9]+$/,
  "macos-arm64": /^[a-zA-Z0-9]+$/
};
function areAllFilesInZipValid(files: Array<string>, pattern: RegExp) {
  return files.every(
    // all files must be either a binary either a manifest either an image
    (file) =>
      (!!file.match(pattern) !== // file is a binary
        IMAGE_FORMATS.some((format) => file.endsWith(`.${format}`))) !== // file is an image
      (file === "manifest.json") // file is a manifest
  );
}
async function checkPluginZips(plugin: StorePlugin) {
  for (let asset in plugin.assets) {
    let assetUrl = plugin.assets[asset].url;
    let files = await getZipFileList(assetUrl);
    const filesAreValid = areAllFilesInZipValid(files, patterns[asset]);

    if (!filesAreValid) {
      throw new Error(`Invalid files in zip for ${asset}`);
    }

    let checksumIsValid = await checkFileChecksum(
      assetUrl,
      plugin.assets[asset].checksum
    );

    if (!checksumIsValid) {
      throw new Error("Invalid asset checksum");
    }
  }
}
export async function validateList() {
  const { plugins, lastVersion, commonPlugins, newPlugins, updatedPlugins } =
    await getPlugins();
  // check if all plugins have a different name
  const setPluginName = new Set(plugins.map((plugin) => plugin.name));
  const allPluginsHaveDifferentNames = setPluginName.size == plugins.length;

  if (!allPluginsHaveDifferentNames) {
    throw new Error("Error: Plugin name is duplicated");
  }

  const onlyOneUpdateAndNoNew =
    newPlugins.length == 0 && updatedPlugins.length == 1;
  const onlyOneNewAndNoUpdate =
    newPlugins.length == 1 && updatedPlugins.length == 0;
  const onlyOneChange = onlyOneNewAndNoUpdate || onlyOneUpdateAndNoNew;

  if (!onlyOneChange) {
    console.warn("There should be either one new plugin or one updated plugin");
  } else {
    //changedPlugin is either the new plugin or the updated plugin
    let changedPlugin = !!newPlugins.length ? newPlugins[0] : updatedPlugins[0];
    const allCommonPluginsWhereTheSameInLastVersion = commonPlugins.every(
      (plugin) => plugin.pluginInLastStoreVersion(lastVersion)
    );

    const logo = changedPlugin.logo;
    const url = changedPlugin.url;

    const isUrlValid = !!url.match(
      /^(https?:\/\/)[a-zA-Z0-9]+$/
    );

    if (!isUrlValid) {
      throw new Error("Invalid url");
    }

    if (!allCommonPluginsWhereTheSameInLastVersion) {
      throw new Error("Invalid commonPlugins");
    }

    const dimLogo = await getImageDimensions(logo);

    if (dimLogo == null) {
      throw new Error(
        "Couldn't get logo dimensions - check if the url is correct"
      );
    }

    const isLogoSquare = dimLogo!.width! == dimLogo!.height!;
    const isLogoSmallerThan40px = dimLogo!.width! < 40;

    if (!isLogoSquare && !isLogoSmallerThan40px) {
      throw new Error("Logo width should be a square smaller than 40px");
    }

    if (onlyOneUpdateAndNoNew) {
      const isUpdatedVersionHigher =
        changedPlugin.isNewVersionHigher(lastVersion);
      if (!isUpdatedVersionHigher) {
        throw new Error("Invalid plugin version");
      }
    }
    await checkPluginZips(changedPlugin);
  }
}

validateList();
