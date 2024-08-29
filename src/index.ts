import openAi from "./lib/open-ai";
import puppeteer, { Page } from "puppeteer";

const fs = require("fs");
// URL of the page we want to scrape
const axios = require("axios");
const cheerio = require("cheerio");
const pretty = require("pretty");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

async function scraper(html: string) {
  const response = await openAi.chat.completions.create({
    model: "gpt-3.5-turbo", // Specify the model
    messages: [
      {
        role: "user",
        content: `here is the html of a sample website -> ${html}. Extract all the valuable information you can in a json format and return it.`,
      },
    ],
  });

  return response.choices[0].message.content;
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

async function main() {
  try {
  } catch (error: any) {
    console.error("error occured", error, error.message);
  }
}
main();

async function SimpleScraper() {
  const markup = `
    <ul class="fruits">
    <li class="fruits__mango"> Mango </li>
    <li class="fruits__apple"> Apple </li>
    </ul>
    `;

  //   const aiResponse = await scraper(markup);
  //   console.log(aiResponse);

  const $ = cheerio.load(markup);
  console.log(pretty($.html()));
  console.log($.html());
  const mango = $(".fruits__mango");
  console.log(mango.html()); // Mango

  const listItems = $("li");
  console.log(listItems.length); // 2
  listItems.each(function (idx: number, el: cheerio.Element) {
    console.log($(el).text());
  });
}

async function scrapeData(url: string) {
  try {
    // Fetch HTML of the page we want to scrape
    const { data } = await axios.get(url);
    // Load HTML we fetched in the previous line
    const $ = cheerio.load(data);
    // Select all the list items in plainlist class
    const listItems = $(".plainlist ul li");
    // Stores data for all countries
    const countries: { name: string; iso3: string }[] = [];
    // Use .each method to loop through the li we selected
    listItems.each((idx: number, el: cheerio.Element) => {
      // Object holding data for each country/jurisdiction
      const country = { name: "", iso3: "" };
      // Select the text content of a and span elements
      // Store the textcontent in the above object
      country.name = $(el).children("a").text();
      country.iso3 = $(el).children("span").text();
      // Populate countries array with country data
      countries.push(country);
    });
    // Logs countries array to the console
    console.dir(countries);
    // Write countries array in countries.json file
    fs.writeFile(
      "coutries.json",
      JSON.stringify(countries, null, 2),
      (err: any) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("Successfully written data to file");
      }
    );
  } catch (err) {
    console.error(err);
  }
}

async function initializeBrowser(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  return page;
}
