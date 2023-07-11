export const structure = {
  type: "object",
  properties: {
    name: { type: "string", maxLength: 30 },
    author: { type: "string", maxLength: 30 },
    logo: { type: "string" },
    massaStationVersion: { type: "string" },
    description: { type: "string", maxLength: 80 },
    assets: {
      type: "object",
      properties: {
        windows: { $ref: "#/definitions/asset" },
        linux: { $ref: "#/definitions/asset" },
        "macos-arm64": { $ref: "#/definitions/asset" },
        "macos-amd64": { $ref: "#/definitions/asset" },
      },
    },
    version: { type: "string" },
    url: { type: "string" },
  },
  required: [
    "name",
    "logo",
    "massaStationVersion",
    "description",
    "assets",
    "version",
    "url",
  ],
  definitions: {
    asset: {
      type: "object",
      properties: { url: { type: "string" }, checksum: { type: "string" } },
      required: ["url", "checksum"],
    },
  },
};

export const pluginStructure = {
  type: "object",
  properties: {
    author: { type: "string", maxLength: 30 },
    name: { type: "string", maxLength: 30 },
    description: { type: "string", maxLength: 80 },
    logo: { type: "string" },
    home: { type: "string" },
    version: { type: "string" },
    apispec: { type: "string" },
  },
  required: [
    "author",
    "name",
    "description",
    "logo",
    "home",
    "version",
    "apispec",
  ],
};

export const IMAGE_FORMATS = [
  "bmp",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "tif",
  "tiff",
  "webp",
];
