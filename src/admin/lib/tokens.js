// Shared design values for the admin panel
// Secondary text #666 on white = 5.7:1 (passes AA). Input borders #8a8a8a = 3.4:1 (passes 3:1).
export const MUTED = 'text-[#666666]';
export const FIELD_BORDER = 'border-[#8a8a8a]';

// One wording for status everywhere in the panel
export const STATUS = {
  published: { label: 'On website', help: 'Customers can see it.', badge: 'bg-accent text-white' },
  draft: { label: 'Draft', help: 'Not on the website yet — still being prepared.', badge: 'bg-[#ececec] text-primary' },
  hidden: { label: 'Hidden', help: 'Kept here, but taken off the website.', badge: `bg-white text-primary border ${FIELD_BORDER}` },
};

// Enquiry stages, in the order they normally happen (brand red / grey / white only;
// the words carry the meaning, colour only helps "New" stand out)
export const ENQUIRY_STATUS = {
  new: { label: 'New', help: 'Nobody has replied yet.', badge: 'bg-accent text-white' },
  contacted: { label: 'Contacted', help: 'You’ve spoken to the customer.', badge: 'bg-white text-accent border border-accent' },
  quoted: { label: 'Quote sent', help: 'Price and details sent.', badge: 'bg-primary text-white' },
  won: { label: 'Order received', help: 'The customer ordered.', badge: 'bg-white text-primary border-2 border-primary' },
  lost: { label: 'Closed — no order', help: 'Finished without an order.', badge: 'bg-[#ececec] text-primary' },
};
