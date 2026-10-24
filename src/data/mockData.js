export const categories = [
  { id: 1, name: "Burgers", icon: "🍔", color: "#FFE5D9" },
  { id: 2, name: "Pizza", icon: "🍕", color: "#FFD6E0" },
  { id: 3, name: "Biryani", icon: "🍛", color: "#FFF3B0" },
  { id: 4, name: "Desserts", icon: "🍰", color: "#E0BBE4" },
  { id: 5, name: "Drinks", icon: "🥤", color: "#B5EAD7" },
  { id: 6, name: "Fast Food", icon: "🌮", color: "#FFB7B2" },
];

export const restaurants = [
  {
    id: 1,
    name: "Burger King",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500",
    cuisine: "Burgers, Fast Food",
    rating: 4.5,
    deliveryTime: "25-30 min",
    deliveryFee: 50,
    minOrder: 200,
  },
  {
    id: 2,
    name: "Pizza Hut",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
    cuisine: "Pizza, Italian",
    rating: 4.3,
    deliveryTime: "30-40 min",
    deliveryFee: 60,
    minOrder: 300,
  },
  {
    id: 3,
    name: "Biryani House",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
    cuisine: "Biryani, Pakistani",
    rating: 4.7,
    deliveryTime: "35-45 min",
    deliveryFee: 40,
    minOrder: 250,
  },
  {
    id: 4,
    name: "Sweet Tooth",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500",
    cuisine: "Desserts, Bakery",
    rating: 4.6,
    deliveryTime: "20-25 min",
    deliveryFee: 30,
    minOrder: 150,
  },
];

export const menuItems = [
  { id: 1, restaurantId: 1, name: "Classic Beef Burger", price: 450, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", category: "Burgers" },
  { id: 2, restaurantId: 1, name: "Chicken Cheese Burger", price: 550, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400", category: "Burgers" },
  { id: 3, restaurantId: 1, name: "French Fries", price: 200, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400", category: "Sides" },
  { id: 4, restaurantId: 2, name: "Pepperoni Pizza", price: 1200, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400", category: "Pizza" },
  { id: 5, restaurantId: 2, name: "Margherita Pizza", price: 1000, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400", category: "Pizza" },
  { id: 6, restaurantId: 3, name: "Chicken Biryani", price: 350, image: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400", category: "Biryani" },
  { id: 7, restaurantId: 3, name: "Beef Biryani", price: 400, image: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400", category: "Biryani" },
  { id: 8, restaurantId: 4, name: "Chocolate Cake", price: 800, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", category: "Cake" },
  { id: 9, restaurantId: 4, name: "Ice Cream Sundae", price: 350, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400", category: "Ice Cream" },
];