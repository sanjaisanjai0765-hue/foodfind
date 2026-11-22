/* FOODFIND sample data. ALL restaurants below are FICTIONAL SAMPLES.
   To connect a backend later, replace FF_DATA with a fetch() to your API
   returning the same shape. `offset` = [lat, lng] shift from the chosen
   location so sample places always appear nearby. Put real photos in
   assets/images/ and set `img` on a restaurant or dish. */
const FF_DATA = {
  cities: {
    chennai:   { label: "Chennai",   lat: 13.0827, lng: 80.2707 },
    bengaluru: { label: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    mumbai:    { label: "Mumbai",    lat: 19.0760, lng: 72.8777 },
    delhi:     { label: "Delhi",     lat: 28.6139, lng: 77.2090 }
  },
  categories: [
    { id: "South Indian", emoji: "🥞" }, { id: "North Indian", emoji: "🍛" },
    { id: "Chinese", emoji: "🥡" },      { id: "Italian", emoji: "🍕" },
    { id: "Fast Food", emoji: "🍔" },    { id: "Biryani", emoji: "🍚" },
    { id: "Desserts", emoji: "🍨" },     { id: "Beverages", emoji: "🥤" }
  ],
  filters: [
    { id: "all", label: "All Restaurants" }, { id: "veg", label: "Vegetarian" },
    { id: "nonveg", label: "Non-Vegetarian" }, { id: "Budget", label: "Budget Restaurants" },
    { id: "Cafes", label: "Cafes" }, { id: "Fast Food", label: "Fast Food" },
    { id: "South Indian", label: "South Indian" }, { id: "North Indian", label: "North Indian" },
    { id: "Biryani", label: "Biryani" }, { id: "Chinese", label: "Chinese" },
    { id: "fav", label: "♥ Favourites" }
  ],
  restaurants: [
    { id: 1, name: "Sample Dosa Corner", cuisine: "South Indian", cats: ["South Indian", "Budget", "Beverages"], diet: "veg", rating: 4.3, offset: [0.006, 0.004], address: "Sample address, Main Road", emoji: "🥞", color: "#c2410c",
      special: "Masala Dosa", menu: [
      { name: "Masala Dosa", price: 80, veg: true, emoji: "🥞", desc: "Crisp rice crepe with spiced potato filling." },
      { name: "Idli Sambar", price: 50, veg: true, emoji: "🍥", desc: "Steamed rice cakes with lentil stew." },
      { name: "Ghee Pongal", price: 70, veg: true, emoji: "🍲", desc: "Creamy rice and lentils tempered with ghee." },
      { name: "Filter Coffee", price: 30, veg: true, emoji: "☕", desc: "Strong coffee with frothy milk." }] },
    { id: 2, name: "Sample Biryani House", cuisine: "Biryani", cats: ["Biryani"], diet: "both", rating: 4.5, offset: [-0.012, 0.009], address: "Sample address, Market Street", emoji: "🍚", color: "#b45309",
      special: "Chicken Dum Biryani", menu: [
      { name: "Chicken Dum Biryani", price: 220, veg: false, emoji: "🍗", desc: "Slow-cooked basmati rice layered with marinated chicken." },
      { name: "Mutton Biryani", price: 320, veg: false, emoji: "🍖", desc: "Fragrant rice with tender mutton pieces." },
      { name: "Veg Biryani", price: 160, veg: true, emoji: "🥕", desc: "Seasonal vegetables cooked with whole spices." },
      { name: "Onion Raita", price: 40, veg: true, emoji: "🥣", desc: "Cooling yoghurt side." }] },
    { id: 3, name: "Sample Wok Street", cuisine: "Chinese", cats: ["Chinese", "Fast Food"], diet: "both", rating: 4.1, offset: [0.018, -0.011], address: "Sample address, Lake View", emoji: "🥡", color: "#b91c1c",
      special: "Chicken Manchurian", menu: [
      { name: "Veg Hakka Noodles", price: 150, veg: true, emoji: "🍜", desc: "Wok-tossed noodles with crunchy vegetables." },
      { name: "Chicken Manchurian", price: 190, veg: false, emoji: "🍗", desc: "Fried chicken in a tangy garlic-soy sauce." },
      { name: "Veg Fried Rice", price: 140, veg: true, emoji: "🍚", desc: "Smoky fried rice with spring onion." },
      { name: "Spring Rolls", price: 110, veg: true, emoji: "🥟", desc: "Crispy rolls with cabbage and carrot." }] },
    { id: 4, name: "Sample Tandoor Nights", cuisine: "North Indian", cats: ["North Indian"], diet: "both", rating: 4.4, offset: [-0.02, -0.006], address: "Sample address, Central Avenue", emoji: "🍛", color: "#9a3412",
      special: "Butter Chicken", menu: [
      { name: "Butter Chicken", price: 280, veg: false, emoji: "🍛", desc: "Tandoori chicken in a rich tomato-butter gravy." },
      { name: "Paneer Tikka", price: 220, veg: true, emoji: "🧀", desc: "Charred paneer cubes with peppers." },
      { name: "Dal Makhani", price: 190, veg: true, emoji: "🫘", desc: "Black lentils simmered overnight." },
      { name: "Garlic Naan", price: 50, veg: true, emoji: "🫓", desc: "Tandoor-baked bread with garlic butter." }] },
    { id: 5, name: "Sample Brew Cafe", cuisine: "Cafe", cats: ["Cafes", "Desserts", "Beverages"], diet: "veg", rating: 4.6, offset: [0.003, -0.016], address: "Sample address, Park Lane", emoji: "☕", color: "#78350f",
      special: "Cold Coffee", menu: [
      { name: "Cold Coffee", price: 120, veg: true, emoji: "🧋", desc: "Blended iced coffee with cream." },
      { name: "Veg Grilled Sandwich", price: 110, veg: true, emoji: "🥪", desc: "Toasted sandwich with cheese and veggies." },
      { name: "Chocolate Brownie", price: 130, veg: true, emoji: "🍫", desc: "Warm fudgy brownie." },
      { name: "Mango Smoothie", price: 100, veg: true, emoji: "🥭", desc: "Fresh mango blended with yoghurt." }] },
    { id: 6, name: "Sample Burger Shack", cuisine: "Fast Food", cats: ["Fast Food", "Budget"], diet: "both", rating: 4.0, offset: [0.025, 0.014], address: "Sample address, Station Road", emoji: "🍔", color: "#a16207",
      special: "Smoky Chicken Burger", menu: [
      { name: "Smoky Chicken Burger", price: 160, veg: false, emoji: "🍔", desc: "Grilled chicken patty with smoky sauce." },
      { name: "Veg Burger", price: 120, veg: true, emoji: "🍔", desc: "Crispy vegetable patty with lettuce." },
      { name: "Peri Peri Fries", price: 80, veg: true, emoji: "🍟", desc: "Crinkle fries with spicy seasoning." },
      { name: "Chicken Wrap", price: 140, veg: false, emoji: "🌯", desc: "Chicken strips rolled in a soft wrap." }] },
    { id: 7, name: "Sample Pizza Forno", cuisine: "Italian", cats: ["Italian", "Desserts"], diet: "both", rating: 4.2, offset: [-0.008, 0.022], address: "Sample address, Garden Street", emoji: "🍕", color: "#991b1b",
      special: "Wood-fired Margherita", menu: [
      { name: "Wood-fired Margherita", price: 250, veg: true, emoji: "🍕", desc: "Tomato, mozzarella and basil on a thin crust." },
      { name: "Pasta Alfredo", price: 230, veg: true, emoji: "🍝", desc: "Creamy white-sauce penne." },
      { name: "Garlic Bread", price: 120, veg: true, emoji: "🥖", desc: "Toasted bread with herb butter." },
      { name: "Tiramisu", price: 150, veg: true, emoji: "🍰", desc: "Coffee-soaked layered dessert." }] },
    { id: 8, name: "Sample Sweet Spot", cuisine: "Desserts", cats: ["Desserts", "Budget", "Beverages"], diet: "veg", rating: 4.4, offset: [0.014, 0.03], address: "Sample address, Temple Road", emoji: "🍨", color: "#9d174d",
      special: "Rose Falooda", menu: [
      { name: "Rose Falooda", price: 120, veg: true, emoji: "🍧", desc: "Rose milk, vermicelli, basil seeds and ice cream." },
      { name: "Gulab Jamun", price: 60, veg: true, emoji: "🍡", desc: "Soft milk dumplings in sugar syrup." },
      { name: "Rasmalai", price: 90, veg: true, emoji: "🥛", desc: "Paneer discs in saffron milk." },
      { name: "Ice Cream Sundae", price: 140, veg: true, emoji: "🍨", desc: "Three scoops with nuts and sauce." }] }
  ]
};
