import {
  getPlugins,
  IMAGE_FORMATS,
  checkFileChecksum,
  getZipFileList,
  getImageDimensions,
  StorePlugin,
} from "./utils";

const patterns = {
  windows: /_windows-amd64.exe$/,
  linux: /_linux-amd64$/,
  "macos-amd64": /_darwin-amd64$/,
  "macos-arm64": /_darwin-arm64$/,
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
  const { changedPlugins } = await getPlugins();
  // check if all plugins have a different name
  const setPluginName = new Set(changedPlugins.map((plugin) => plugin.name));
  const allPluginsHaveDifferentNames =
    setPluginName.size == changedPlugins.length;

  if (!allPluginsHaveDifferentNames) {
    throw new Error("Error: Plugin name is duplicated");
  }

  changedPlugins.forEach(async (changedPlugin) => {
    const logo = changedPlugin.getLogoPath();
    const url = changedPlugin.url;

    // url should be a github repo : http(s)://github.com/<org>/<repo>
    const isUrlValid = !!url.match(
      /https:\/\/github.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/
    );

    if (!isUrlValid) {
      throw new Error("Invalid url");
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

    await checkPluginZips(changedPlugin);
  });
}

validateList();
