const { v4: uuidv4 } = require('uuid');

function generateId() {
  return uuidv4();
}

function generateInvoiceNumber(prefix = 'INV') {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const time = now.getTime().toString().slice(-6);
  return `${prefix}-${year}${month}${day}-${time}`;
}

function generateOrderNumber() {
  return generateInvoiceNumber('WO');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function paginate(query, page = 1, limit = 20) {
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

module.exports = {
  generateId,
  generateInvoiceNumber,
  generateOrderNumber,
  formatCurrency,
  paginate
};
