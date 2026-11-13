// Forgiving product search: matches product names, categories, keywords
// (common names and misspellings), descriptions and applications.

const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    // treat "heaters"/"heater", "thermocouples"/"thermocouple" alike
    .map((word) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word));

const cache = new WeakMap();

const fieldsFor = (product) => {
  if (!cache.has(product)) {
    const join = (parts) => ' ' + normalize(parts.join(' ')).join(' ') + ' ';
    const names = [product.name, ...(product.keywords || [])];
    cache.set(product, {
      name: join([product.name]),
      phrases: names.map((n) => join([n])),
      strong: join([...names, product.categoryLabel]),
      all: join([...names, product.categoryLabel, product.shortDescription, ...(product.applications || [])]),
    });
  }
  return cache.get(product);
};

// Every word typed must appear somewhere. Results are ranked so that a product
// whose name or keyword matches the typed phrase comes first, then products
// whose name/keywords contain all the words, then description matches.
// If nothing matches every word, fall back to products matching any word.
export function searchProducts(products, query) {
  const words = normalize(query);
  if (words.length === 0) return products;
  const phrase = ' ' + words.join(' ') + ' ';

  const scored = products.map((product, index) => {
    const f = fieldsFor(product);
    const hits = words.filter((w) => f.all.includes(w)).length;
    let score = hits;
    if (f.name.includes(phrase)) score += 1000;
    if (f.phrases.some((p) => p === phrase)) score += 600; // keyword typed exactly
    else if (f.phrases.some((p) => p.includes(phrase))) score += 500;
    if (words.every((w) => f.strong.includes(w))) score += 100;
    return { product, hits, score, index };
  });

  const byScore = (a, b) => b.score - a.score || a.index - b.index;
  const all = scored.filter((s) => s.hits === words.length);
  if (all.length > 0) return all.sort(byScore).map((s) => s.product);

  return scored
    .filter((s) => s.hits > 0)
    .sort(byScore)
    .map((s) => s.product);
}
