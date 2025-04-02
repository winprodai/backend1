function cn(...inputs) {
  // This is a placeholder since we're not using Tailwind in this backend project
  return inputs.filter(Boolean).join(' ');
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

module.exports = {
  cn,
  formatDate,
  formatCurrency,
  truncateText
};