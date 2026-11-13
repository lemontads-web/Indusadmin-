// Single source of truth for product categories (names follow indusheaters.com).
// `slug` must match the `category` field in products.json.
const categories = [
  { slug: "tubular-heaters", label: "Tubular Heaters", image: "/images/products/main-image7.jpg", desc: "Straight or formed elements in SS, Copper, Inconel and Titanium sheaths." },
  { slug: "cartridge-heaters", label: "Cartridge Heaters", image: "/images/products/main-image3.jpg", desc: "Low density, high density, split type and ceramic cartridge heaters." },
  { slug: "band-heaters", label: "Band Heaters", image: "/images/products/main-image9.jpg", desc: "Mica, ceramic and brass sealed band heaters for barrels and dies." },
  { slug: "coil-heaters", label: "Coil Heaters", image: "/images/products/main-image5.jpg", desc: "Small diameter, high power coils for hot runner nozzles — up to 450°C." },
  { slug: "hot-runner-heaters", label: "Hot Runner Heaters", image: "/images/products/main-image1.jpg", desc: "Sleeve type coil heaters for hot runner nozzles." },
  { slug: "manifold-heaters", label: "Manifold Heaters", image: "/images/products/main-image6.jpg", desc: "Easy-to-bend heaters shaped to your hot runner manifold." },
  { slug: "glass-heaters", label: "Glass Heaters", image: "/images/products/main-image8.jpg", desc: "Short wave, medium wave, ceramic infrared and silica glass heaters." },
  { slug: "thermocouples", label: "Thermocouples", image: "/images/products/main-image2.jpg", desc: "J, K, R, S and N type thermocouples and sensors." },
  { slug: "temperature-controllers", label: "Temperature Controllers", image: "/images/products/temperaturecontroller1.jpg", desc: "Digital controllers with heating and cooling control." },
];

export const getCategory = (slug) => categories.find((c) => c.slug === slug);

export default categories;
