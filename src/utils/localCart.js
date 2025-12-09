export function addToCart(item){
  const raw = localStorage.getItem('cart');
  const cart = raw ? JSON.parse(raw) : [];
  cart.push({ ...item, addedAt: new Date().toISOString() });
  localStorage.setItem('cart', JSON.stringify(cart));
}

export function getCart(){
  const raw = localStorage.getItem('cart');
  return raw ? JSON.parse(raw) : [];
}

export function clearCart(){
  localStorage.removeItem('cart');
}
