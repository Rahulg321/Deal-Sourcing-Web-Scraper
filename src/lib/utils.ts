const path = require("path");
import { Page } from "puppeteer";
const cheerio = require("cheerio");
const fs = require("fs");
const axios = require("axios");

export async function extractImages(page: Page) {
  const images = await page.$$eval("img", (elements) =>
    elements.map((img) => img.src)
  );
  return images;
}
async function saveImages(images: string[], outputFolder: string) {
  const imgFolder = path.join(__dirname, outputFolder, "images");
  for (let i = 0; i < images.length; i++) {
    const imageUrl = images[i];
    const timestamp = new Date().getTime();
    const imageFileName = path.join(
      imgFolder,
      `image_${timestamp}_${i + 1}.jpg`
    );
    try {
      await downloadImage(imageUrl, imageFileName);
    } catch (error) {
      console.error("Error saving image:", error);
    }
  }
}

async function downloadImage(url: string, filepath: string) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("finish", () => resolve(filepath))
      .on("error", (e: Error) => reject(e));
  });
}

async function extractVideoLinks(page: Page) {
  const htmlContent = await page.content();
  const $ = cheerio.load(htmlContent);

  const videoLinks: string[] = [];
  $("a[href*=video]").each((index: number, element: cheerio.Element) => {
    const videoLink = $(element).attr("href");
    videoLinks.push(videoLink);
  });
  return videoLinks;
}

async function extractTextContent(page: Page) {
  const htmlContent = await page.content();
  const $ = cheerio.load(htmlContent);
  const textContent: string[] = [];
  $("h1, h2, h3, h4, p").each((index: number, element: cheerio.Element) => {
    const content = $(element).text().trim();
    textContent.push(content);
  });
  return textContent;
}

async function createFolders(outputFolder: string) {
  const csvFolder = path.join(__dirname, outputFolder, "csv");
  const imgFolder = path.join(__dirname, outputFolder, "images");
  const jsonFolder = path.join(__dirname, outputFolder, "json");
  const textFolder = path.join(__dirname, outputFolder, "text");
  const videoFolder = path.join(__dirname, outputFolder, "videos");

  await Promise.all([
    fs.promises.mkdir(csvFolder, { recursive: true }),
    fs.promises.mkdir(imgFolder, { recursive: true }),
    fs.promises.mkdir(jsonFolder, { recursive: true }),
    fs.promises.mkdir(textFolder, { recursive: true }),
    fs.promises.mkdir(videoFolder, { recursive: true }),
  ]);
}
