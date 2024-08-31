import { saveListingsToExcel } from "./lib/excel-sheet";
import puppeteer, { Page, Browser } from "puppeteer";
import dotenv from "dotenv";
const cheerio = require("cheerio");

dotenv.config();

async function extractTextContent(html: string) {
  const $ = cheerio.load(html);

  return $("article.wpgb-card")
    .map((_: number, element: cheerio.Element) => ({
      title: $(element).find("h3 a").text().trim() || "",
      link: $(element).find("h3 a").attr("href") || "",
      state: $(element).find("div.wpgb_state span").html() || "",
      category: $(element).find("div.wpgb_category span").html() || "",
      asking_price: $(element).find("div.wpgb_price").html() || "",
      listing_code: $(element).find("div.wpgb_code").html() || "",
      under_contract: $(element).find("div.wpgb_loi").html() || "",
      revenue: $(element).find("div.wpgb_revenue").html() || "",
    }))
    .get(); // .get() converts the cheerio object to a plain array
}

async function extractDetailsFromDedicatedPage(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "networkidle2" });

    // Extract all main text content from the dedicated page
    const html = await page.content();
    const $ = cheerio.load(html);

    // Select all heading tags (h1 to h6) and paragraph tags
    const mainContent = $("h1, h2, h3, h4, h5, h6, p")
      .map((_, element) => {
        const tagName = element.name;
        const text = $(element).text().trim();
        return `[${tagName.toUpperCase()}] ${text}`;
      })
      .get()
      .join("\n\n");

    return {
      main_content: mainContent,
    };
  } catch (error: any) {
    console.error(
      "Error occurred while extracting details from dedicated page",
      error.message
    );
    return {};
  }
}

async function navigateToNextPage(page: Page): Promise<boolean> {
  const html = await page.content();
  const $ = cheerio.load(html);

  const nextPageButton = $("ul.wpgb-pagination li.wpgb-page a").filter(
    (_: number, element: cheerio.Element) =>
      $(element).text().includes("Next →")
  );

  if (nextPageButton.length > 0) {
    const nextPageHref = nextPageButton.attr("href");
    if (nextPageHref) {
      await page.goto(nextPageHref, { waitUntil: "networkidle2" });
      return true;
    }
  }

  return false; // No next page
}

async function main() {
  let browser: Browser | null = null;

  try {
    const result = await initializeBrowser(
      "https://americanhealthcarecapital.com/current-listings/"
    );
    if (!result) {
      console.log("Could not load page using headless browser");
      return;
    }

    browser = result.browser;
    const page = result.page;
    const allScrapedData = [];

    let hasNextPage = true;
    while (hasNextPage) {
      const html = await page.content();
      const scrapedData = await extractTextContent(html);
      allScrapedData.push(...scrapedData);
      console.log("Scraped Data from current page:", scrapedData);

      hasNextPage = await navigateToNextPage(page);
    }

    console.log("All scraped data is ", allScrapedData);
    saveListingsToExcel(allScrapedData, "listings.xlsx");
    console.log("Done scraping all pages");
  } catch (error: any) {
    console.error("Error occurred", error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
}

async function initializeBrowser(url: string) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    return { browser, page };
  } catch (error: any) {
    console.error(
      "An error occurred while trying to initialize the browser",
      error.message
    );
    return null;
  }
}

main();
