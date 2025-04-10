const PDFDocument = require("pdfkit");

module.exports = function generatePDF(orders) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(18).text("Riepilogo Ordini", { align: "center" }).moveDown();

    orders.forEach(order => {
      doc.fontSize(12).text(`Cliente: ${order.billing.first_name} ${order.billing.last_name}`);
      doc.text(`Email: ${order.billing.email}`);
      doc.text(`Data: ${new Date(order.date_created).toLocaleDateString()}`);
      doc.text("Prodotti:");
      order.line_items.forEach(item => {
        doc.text(` - ${item.name} x${item.quantity}`);
      });
      doc.moveDown();
    });

    doc.end();
  });
};
