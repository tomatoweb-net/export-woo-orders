const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { Parser } = require("json2csv");

require("dotenv").config();


const WC_API_URL = process.env.WC_API_URL;
const WC_KEY = process.env.WC_KEY;
const WC_SECRET = process.env.WC_SECRET;


console.log("🌐 WC_API_URL:", WC_API_URL);
console.log("🔑 WC_KEY:", WC_KEY);
console.log("🔒 WC_SECRET:", WC_SECRET);

async function getOrders(from, to) {
  let page = 1;
  let allOrders = [];

  console.log("➡️ Richiesta ordini WooCommerce...");
  console.log("➡️ Intervallo:", from, "->", to);
  console.log("➡️ Endpoint:", `${WC_API_URL}/orders`);

  while (true) {
    try {
      const response = await axios.get(`${WC_API_URL}/orders`, {
        params: {
          per_page: 100,
          page,
          after: from ? new Date(from).toISOString() : undefined,
          before: to ? new Date(to).toISOString() : undefined,
        },
        auth: {
          username: WC_KEY,
          password: WC_SECRET,
        },
      });

      const data = response.data;
      if (!data.length) break;
      allOrders.push(...data);
      page++;
    } catch (err) {
      console.error("❌ Errore durante getOrders:", err.message);
      console.error(err.response?.data || err);
      throw err; // ri-lancia per far scattare il messaggio in /dashboard
    }
  }

  return allOrders.map((order) => ({
    id: order.id,
    date: order.date_created,
    customer: `${order.billing.first_name} ${order.billing.last_name}`,
    email: order.billing.email,
    phone: order.billing.phone,
    city: order.billing.city,
    region: order.billing.state,
    total: order.total,
    items: order.line_items.map((i) => `${i.name} (x${i.quantity})`).join(", "),
  }));
}


function exportToCSV(data) {
  const fields = ["id", "date", "customer", "email", "phone", "city", "region", "total", "items"];
  const parser = new Parser({ fields, delimiter: ";" });
  const csv = parser.parse(data);
  const filePath = path.join(__dirname, "../orders_export.csv");
  fs.writeFileSync(filePath, csv);
  return filePath;
}

function exportToXLS(data) {
  const ws = xlsx.utils.json_to_sheet(data);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Ordini");
  const filePath = path.join(__dirname, "../orders_export.xlsx");
  xlsx.writeFile(wb, filePath);
  return filePath;
}

module.exports = {
  getOrders,
  exportToCSV,
  exportToXLS,
};
