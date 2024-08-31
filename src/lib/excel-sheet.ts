import * as XLSX from "xlsx";

interface Listing {
  title: string;
  link: string;
  state: string;
  category: string;
  asking_price: string;
  listing_code: string;
  under_contract: string;
  revenue: string;
}

export function saveListingsToExcel(listings: Listing[], fileName: string) {
  // Define the heading columns
  const headings = [
    "Title",
    "Link",
    "State",
    "Category",
    "Asking Price",
    "Listing Code",
    "Under Contract",
    "Revenue",
  ];

  // Map the listings data to an array of arrays
  const data = listings.map((listing) => [
    listing.title,
    listing.link,
    listing.state,
    listing.category,
    listing.asking_price,
    listing.listing_code,
    listing.under_contract,
    listing.revenue,
  ]);

  // Add the headings as the first row
  const worksheetData = [headings, ...data];

  // Create a new workbook and worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Listings");

  // Write the workbook to a file
  XLSX.writeFile(workbook, fileName);
}
