import { createHash } from "crypto";
const axios = require("axios");
const AdmZip = require("adm-zip");
/**
 * Fetches the contents of a URL
 * @param {string} url - The URL to fetch
 * @returns {Promise<Buffer>} - A promise that resolves with the contents of the URL as a Buffer
 */
export async function get(url: string): Promise<Buffer> {
  const options = {
    method: "GET",
    url: url,
    responseType: "arraybuffer",
  };
  const { data } = await axios(options);
  return data;
}
/**
 * Gets the list of files in a zip file located at the specified URL
 * @param {string} url - The URL of the zip file
 * @returns {Promise<string[]>} - A promise that resolves with the list of files in the zip file
 */
export async function getZipFileList(url: string): Promise<string[]> {
  const zipFileBuffer = await get(url);
  const zip = new AdmZip(zipFileBuffer);
  const entries = zip.getEntries();
  return entries.map((entry) => entry.name);
}

/**
 * Calculates the checksum of a file
 * @param {string} url - The URL of the file to calculate the checksum for
 * @returns {Promise<string>} - A promise that resolves with the checksum of the file
 */

export async function calculateChecksum(url: string): Promise<string> {
  const zipFileBuffer = await get(url);
  const md5sum = createHash("md5").update(zipFileBuffer).digest("hex");
  return md5sum;
}

/**
 * Checks if a file's checksum matches the expected checksum
 * @param {string} path - The path of the file to check
 * @param {string} expectedChecksum - The expected checksum of the file
 * @returns {Promise<boolean>} - A promise that resolves with true if the checksums match, false otherwise
 */
export async function checkFileChecksum(
  path: string,
  expectedChecksum: string
): Promise<boolean> {
  try {
    const fileChecksum = await calculateChecksum(path);
    return fileChecksum === expectedChecksum;
  } catch {
    return false;
  }
}

/**
 * Gets the manifest content of a zip file located at the specified URL
 * @param {string} url - The URL of the zip file
 * @returns {Promise<object>} - A promise that resolves with the manifest content of the zip file
 */
export async function getManifestContent(url: string) {
  const zipFileBuffer = await get(url);
  const zip = new AdmZip(zipFileBuffer);
  const entries = zip.getEntries();
  const manifest = entries.find(
    (entry: { name: string }) => entry.name === "manifest.json"
  );

  return await JSON.parse(zip.readAsText(manifest));
}
