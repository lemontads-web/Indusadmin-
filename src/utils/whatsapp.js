// WhatsApp business number (India +91). Default below; the live value comes
// from Supabase site_settings.whatsapp_number once the catalogue loads.
let whatsappNumber = '917338970698';

export const setWhatsAppNumber = (number) => {
  const digits = String(number || '').replace(/\D/g, '');
  if (digits.length >= 10) whatsappNumber = digits;
};

// Opens a WhatsApp chat with the business number and a pre-filled message.
export const whatsappLink = (message = '') =>
  `https://wa.me/${whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

const formatMeasurements = (measurements = {}) =>
  Object.entries(measurements)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join(', ');

// Message for a single product page.
export const productEnquiryMessage = ({ product, quantity, measurements, note, url }) =>
  [
    `Hi Indus Heaters, I'd like a quote for:`,
    `• ${product.name} (${product.categoryLabel})`,
    `  Qty: ${quantity}`,
    formatMeasurements(measurements) && `  Sizes: ${formatMeasurements(measurements)}`,
    note && `  Note: ${note}`,
    url && `Link: ${url}`,
  ].filter(Boolean).join('\n');

// Message for the whole enquiry list.
export const listEnquiryMessage = (items) =>
  [
    `Hi Indus Heaters, I'd like a quote for:`,
    ...items.map((item, i) =>
      [
        `${i + 1}. ${item.name} — Qty: ${item.quantity}`,
        formatMeasurements(item.measurements) && `   Sizes: ${formatMeasurements(item.measurements)}`,
        item.note && `   Note: ${item.note}`,
      ].filter(Boolean).join('\n')
    ),
  ].join('\n');
