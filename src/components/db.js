import Dexie from 'dexie';

const db = new Dexie('LaundryDB');

db.version(1).stores({
  customers: '++id, customerId, name, phoneNumber, vehicleNumber, address,balance',
  services: '++id, name, price, description, duration, category, active',
  orders: '++id, orderNumber, customerId, subtotal, vatAmount, total, amountPaid, paymentMethod, paymentStatus, status, deliveryStatus, createdAt, [customerId+status]',

  orderItems: '++id, orderId, serviceId, quantity, price',
  payments: '++id, customerId, orderId, amount, method, date,note,paymentId,customercode,name,phoneNumber'

});
// Add to your DB schema


export default db;