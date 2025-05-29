// import React, { useState, useEffect } from 'react';
// import { Plus, Minus, Trash2, User, FileText, Printer, Eye, CheckCircle, Clock, DollarSign, Search, Calendar, Phone, Mail } from 'lucide-react';

// const OrderManagementSystem = () => {
//   // Sample data - based on your existing structure
//   const [customers] = useState([
//     { id: 1, customerCode: 'CUST001', name: 'Ahmed Al Mansouri', phone: '+971 50 123 4567', email: 'ahmed@email.com', address: 'Dubai Marina, UAE' },
//     { id: 2, customerCode: 'CUST002', name: 'Sara Abdullah', phone: '+971 55 987 6543', email: 'sara@email.com', address: 'Jumeirah, Dubai, UAE' },
//     { id: 3, customerCode: 'CUST003', name: 'Mohamed Hassan', phone: '+971 52 456 7890', email: 'mohamed@email.com', address: 'Abu Dhabi, UAE' }
//   ]);

//   const [services] = useState([
//     { id: 1, name: 'Wash & Fold', price: 15.00, duration: 60, category: 'Basic' },
//     { id: 2, name: 'Dry Cleaning', price: 25.00, duration: 120, category: 'Premium' },
//     { id: 3, name: 'Express Wash', price: 20.00, duration: 30, category: 'Express' },
//     { id: 4, name: 'Ironing Service', price: 12.00, duration: 45, category: 'Basic' },
//     { id: 5, name: 'Stain Removal', price: 30.00, duration: 90, category: 'Specialty' }
//   ]);

//   // Order state
//   const [selectedCustomer, setSelectedCustomer] = useState('');
//   const [orderItems, setOrderItems] = useState([]);
//   const [showBill, setShowBill] = useState(false);
//   const [orders, setOrders] = useState([]);
//   const [currentOrderId, setCurrentOrderId] = useState(null);
//   const [searchCustomer, setSearchCustomer] = useState('');
//   const [searchService, setSearchService] = useState('');

//   // Load orders from memory on component mount
//   useEffect(() => {
//     const sampleOrders = [
//       {
//         id: 1,
//         orderNumber: 'ORD-001',
//         customerId: 1,
//         customer: customers[0],
//         items: [{ id: 1, service: services[0], quantity: 2, price: 15.00 }],
//         subtotal: 30.00,
//         vatAmount: 1.50,
//         total: 31.50,
//         status: 'in_progress',
//         paymentStatus: 'pending',
//         createdAt: new Date().toISOString()
//       }
//     ];
//     setOrders(sampleOrders);
//   }, []);

//   // Calculate totals
//   const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   const vatAmount = subtotal * 0.05; // 5% VAT
//   const total = subtotal + vatAmount;

//   // Filtered customers and services
//   const filteredCustomers = customers.filter(customer =>
//     customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
//     customer.customerCode.toLowerCase().includes(searchCustomer.toLowerCase()) ||
//     customer.phone.includes(searchCustomer)
//   );

//   const filteredServices = services.filter(service =>
//     service.name.toLowerCase().includes(searchService.toLowerCase()) ||
//     service.category.toLowerCase().includes(searchService.toLowerCase())
//   );

//   const addService = (service) => {
//     const existingItem = orderItems.find(item => item.serviceId === service.id);
//     if (existingItem) {
//       setOrderItems(orderItems.map(item =>
//         item.serviceId === service.id
//           ? { ...item, quantity: item.quantity + 1 }
//           : item
//       ));
//     } else {
//       setOrderItems([...orderItems, {
//         id: Date.now(),
//         serviceId: service.id,
//         service,
//         quantity: 1,
//         price: service.price
//       }]);
//     }
//   };

//   const updateQuantity = (itemId, quantity) => {
//     if (quantity <= 0) {
//       removeItem(itemId);
//       return;
//     }
//     setOrderItems(orderItems.map(item =>
//       item.id === itemId ? { ...item, quantity } : item
//     ));
//   };

//   const updatePrice = (itemId, price) => {
//     setOrderItems(orderItems.map(item =>
//       item.id === itemId ? { ...item, price: parseFloat(price) || 0 } : item
//     ));
//   };

//   const removeItem = (itemId) => {
//     setOrderItems(orderItems.filter(item => item.id !== itemId));
//   };

//   const generateOrderNumber = () => {
//     return `ORD-${String(orders.length + 1).padStart(3, '0')}`;
//   };

//   const createOrder = () => {
//     if (!selectedCustomer || orderItems.length === 0) {
//       alert('Please select a customer and add at least one service');
//       return;
//     }

//     const customer = customers.find(c => c.id === parseInt(selectedCustomer));
//     const newOrder = {
//       id: Date.now(),
//       orderNumber: generateOrderNumber(),
//       customerId: customer.id,
//       customer,
//       items: [...orderItems],
//       subtotal,
//       vatAmount,
//       total,
//       status: 'in_progress',
//       paymentStatus: 'pending',
//       createdAt: new Date().toISOString()
//     };

//     setOrders([...orders, newOrder]);
//     setCurrentOrderId(newOrder.id);
//     setShowBill(true);
//   };

//   const resetOrder = () => {
//     setSelectedCustomer('');
//     setOrderItems([]);
//     setShowBill(false);
//     setCurrentOrderId(null);
//   };

//   const printBill = () => {
//     window.print();
//   };

//   const getStatusBadge = (status) => {
//     const statusConfig = {
//       pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
//       in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
//       ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
//       completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
//       cancelled: { color: 'bg-red-100 text-red-800', icon: Trash2 }
//     };
    
//     const config = statusConfig[status] || statusConfig.pending;
//     const Icon = config.icon;
    
//     return (
//       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
//         <Icon className="w-3 h-3 mr-1" />
//         {status.replace('_', ' ').toUpperCase()}
//       </span>
//     );
//   };

//   const getPaymentStatusBadge = (status) => {
//     const config = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       paid: 'bg-green-100 text-green-800',
//       partial: 'bg-orange-100 text-orange-800'
//     };
    
//     return (
//       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status] || config.pending}`}>
//         <DollarSign className="w-3 h-3 mr-1" />
//         {status.toUpperCase()}
//       </span>
//     );
//   };

//   const currentOrder = orders.find(order => order.id === currentOrderId);

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//                 <FileText className="text-blue-600" />
//                 Order Management System
//               </h1>
//               <p className="text-gray-600 mt-2">Create and manage service orders with UAE VAT compliance</p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={resetOrder}
//                 className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
//               >
//                 Reset Order
//               </button>
//               <button
//                 onClick={createOrder}
//                 className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
//               >
//                 <Plus size={20} />
//                 Create Order
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
//           {/* Order Creation Panel */}
//           <div className="xl:col-span-2 space-y-6">
//             {/* Customer Selection */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                 <User className="text-blue-600" />
//                 Select Customer
//               </h2>
              
//               <div className="mb-4">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="text"
//                     placeholder="Search customers by name, code, or phone..."
//                     value={searchCustomer}
//                     onChange={(e) => setSearchCustomer(e.target.value)}
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
//                 {filteredCustomers.map((customer) => (
//                   <div
//                     key={customer.id}
//                     onClick={() => setSelectedCustomer(customer.id.toString())}
//                     className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
//                       selectedCustomer === customer.id.toString()
//                         ? 'border-blue-500 bg-blue-50'
//                         : 'border-gray-200 hover:border-gray-300'
//                     }`}
//                   >
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <h3 className="font-semibold text-gray-900">{customer.name}</h3>
//                         <p className="text-sm text-gray-600">{customer.customerCode}</p>
//                         <div className="flex items-center gap-2 mt-2">
//                           <Phone size={14} className="text-gray-400" />
//                           <span className="text-sm text-gray-600">{customer.phone}</span>
//                         </div>
//                       </div>
//                       {selectedCustomer === customer.id.toString() && (
//                         <CheckCircle className="text-blue-500" size={20} />
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Service Selection */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Services</h2>
              
//               <div className="mb-4">
//                 <div className="relative">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//                   <input
//                     type="text"
//                     placeholder="Search services..."
//                     value={searchService}
//                     onChange={(e) => setSearchService(e.target.value)}
//                     className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {filteredServices.map((service) => (
//                   <div
//                     key={service.id}
//                     className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
//                   >
//                     <div className="flex justify-between items-start mb-3">
//                       <div className="flex-1">
//                         <h3 className="font-semibold text-gray-900">{service.name}</h3>
//                         <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-1">
//                           {service.category}
//                         </span>
//                       </div>
//                     </div>
                    
//                     <div className="flex justify-between items-center">
//                       <div className="text-lg font-bold text-green-600">
//                         AED {service.price.toFixed(2)}
//                       </div>
//                       <button
//                         onClick={() => addService(service)}
//                         className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors text-sm"
//                       >
//                         <Plus size={16} />
//                         Add
//                       </button>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Order Summary Panel */}
//           <div className="space-y-6">
//             {/* Current Order */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
//               {selectedCustomer && (
//                 <div className="mb-4 p-3 bg-blue-50 rounded-lg">
//                   <p className="text-sm text-gray-600">Customer:</p>
//                   <p className="font-semibold text-gray-900">
//                     {customers.find(c => c.id === parseInt(selectedCustomer))?.name}
//                   </p>
//                 </div>
//               )}

//               {orderItems.length > 0 ? (
//                 <div className="space-y-4">
//                   <div className="max-h-64 overflow-y-auto">
//                     {orderItems.map((item) => (
//                       <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
//                         <div className="flex-1">
//                           <h4 className="font-medium text-gray-900">{item.service.name}</h4>
//                           <div className="flex items-center gap-4 mt-2">
//                             <div className="flex items-center gap-2">
//                               <button
//                                 onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                                 className="p-1 text-gray-500 hover:text-gray-700"
//                               >
//                                 <Minus size={16} />
//                               </button>
//                               <input
//                                 type="number"
//                                 value={item.quantity}
//                                 onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
//                                 className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
//                                 min="1"
//                               />
//                               <button
//                                 onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                                 className="p-1 text-gray-500 hover:text-gray-700"
//                               >
//                                 <Plus size={16} />
//                               </button>
//                             </div>
//                             <div className="flex items-center gap-1">
//                               <span className="text-sm text-gray-600">AED</span>
//                               <input
//                                 type="number"
//                                 value={item.price}
//                                 onChange={(e) => updatePrice(item.id, e.target.value)}
//                                 className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm"
//                                 step="0.01"
//                                 min="0"
//                               />
//                             </div>
//                           </div>
//                         </div>
//                         <div className="ml-4 text-right">
//                           <p className="font-semibold text-gray-900">
//                             AED {(item.price * item.quantity).toFixed(2)}
//                           </p>
//                           <button
//                             onClick={() => removeItem(item.id)}
//                             className="text-red-500 hover:text-red-700 mt-1"
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Totals */}
//                   <div className="border-t pt-4 space-y-2">
//                     <div className="flex justify-between text-gray-600">
//                       <span>Subtotal:</span>
//                       <span>AED {subtotal.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between text-gray-600">
//                       <span>VAT (5%):</span>
//                       <span>AED {vatAmount.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
//                       <span>Total:</span>
//                       <span>AED {total.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center py-8 text-gray-500">
//                   <FileText size={48} className="mx-auto mb-4 text-gray-300" />
//                   <p>No services added yet</p>
//                   <p className="text-sm">Select services to add to your order</p>
//                 </div>
//               )}
//             </div>

//             {/* Recent Orders */}
//             <div className="bg-white rounded-lg shadow-sm p-6">
//               <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
//               <div className="space-y-3 max-h-64 overflow-y-auto">
//                 {orders.slice(-5).reverse().map((order) => (
//                   <div key={order.id} className="p-3 border border-gray-200 rounded-lg">
//                     <div className="flex justify-between items-start mb-2">
//                       <div>
//                         <p className="font-medium text-gray-900">{order.orderNumber}</p>
//                         <p className="text-sm text-gray-600">{order.customer.name}</p>
//                       </div>
//                       <p className="font-semibold text-green-600">AED {order.total.toFixed(2)}</p>
//                     </div>
//                     <div className="flex justify-between items-center">
//                       {getStatusBadge(order.status)}
//                       {getPaymentStatusBadge(order.paymentStatus)}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Bill Modal */}
//         {showBill && currentOrder && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//               <div className="p-6">
//                 {/* Bill Header */}
//                 <div className="text-center mb-6 border-b pb-6">
//                   <h1 className="text-2xl font-bold text-gray-900">SERVICE INVOICE</h1>
//                   <p className="text-gray-600 mt-2">UAE VAT Registered Business</p>
//                   <p className="text-sm text-gray-500">TRN: 123456789012345</p>
//                 </div>

//                 {/* Order Details */}
//                 <div className="grid grid-cols-2 gap-6 mb-6">
//                   <div>
//                     <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
//                     <p className="text-gray-800">{currentOrder.customer.name}</p>
//                     <p className="text-gray-600">{currentOrder.customer.phone}</p>
//                     <p className="text-gray-600">{currentOrder.customer.email}</p>
//                     <p className="text-gray-600">{currentOrder.customer.address}</p>
//                   </div>
//                   <div className="text-right">
//                     <p><span className="font-semibold">Order Number:</span> {currentOrder.orderNumber}</p>
//                     <p><span className="font-semibold">Date:</span> {new Date(currentOrder.createdAt).toLocaleDateString()}</p>
//                     <p><span className="font-semibold">Status:</span> {getStatusBadge(currentOrder.status)}</p>
//                     <p><span className="font-semibold">Payment:</span> {getPaymentStatusBadge(currentOrder.paymentStatus)}</p>
//                   </div>
//                 </div>

//                 {/* Items Table */}
//                 <div className="mb-6">
//                   <table className="w-full border-collapse border border-gray-300">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="border border-gray-300 px-4 py-2 text-left">Service</th>
//                         <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
//                         <th className="border border-gray-300 px-4 py-2 text-right">Rate (AED)</th>
//                         <th className="border border-gray-300 px-4 py-2 text-right">Amount (AED)</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {currentOrder.items.map((item, index) => (
//                         <tr key={index}>
//                           <td className="border border-gray-300 px-4 py-2">{item.service.name}</td>
//                           <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
//                           <td className="border border-gray-300 px-4 py-2 text-right">{item.price.toFixed(2)}</td>
//                           <td className="border border-gray-300 px-4 py-2 text-right">{(item.price * item.quantity).toFixed(2)}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>

//                 {/* Totals */}
//                 <div className="flex justify-end mb-6">
//                   <div className="w-64">
//                     <div className="flex justify-between py-2 border-b">
//                       <span>Subtotal:</span>
//                       <span>AED {currentOrder.subtotal.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between py-2 border-b">
//                       <span>VAT (5%):</span>
//                       <span>AED {currentOrder.vatAmount.toFixed(2)}</span>
//                     </div>
//                     <div className="flex justify-between py-2 font-bold text-lg">
//                       <span>Total:</span>
//                       <span>AED {currentOrder.total.toFixed(2)}</span>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Footer */}
//                 <div className="text-center text-sm text-gray-600 border-t pt-4">
//                   <p>Thank you for choosing our services!</p>
//                   <p>For any queries, please contact us at support@company.com</p>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
//                   <button
//                     onClick={() => setShowBill(false)}
//                     className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//                   >
//                     Close
//                   </button>
//                   <button
//                     onClick={printBill}
//                     className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
//                   >
//                     <Printer size={18} />
//                     Print Bill
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OrderManagementSystem;
import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, User, FileText, Printer, Eye, CheckCircle, Clock, DollarSign, Search, Calendar, Phone, Mail, Truck, CreditCard } from 'lucide-react';

const OrderManagementSystem = () => {
  // Sample data - based on your existing structure
  const [customers] = useState([
    { id: 1, customerCode: 'CUST001', name: 'Ahmed Al Mansouri', phone: '+971 50 123 4567', email: 'ahmed@email.com', address: 'Dubai Marina, UAE', balance: 0 },
    { id: 2, customerCode: 'CUST002', name: 'Sara Abdullah', phone: '+971 55 987 6543', email: 'sara@email.com', address: 'Jumeirah, Dubai, UAE', balance: 0 },
    { id: 3, customerCode: 'CUST003', name: 'Mohamed Hassan', phone: '+971 52 456 7890', email: 'mohamed@email.com', address: 'Abu Dhabi, UAE', balance: 0 }
  ]);

  const [services] = useState([
    { id: 1, name: 'Wash & Fold', price: 15.00, duration: 60, category: 'Basic' },
    { id: 2, name: 'Dry Cleaning', price: 25.00, duration: 120, category: 'Premium' },
    { id: 3, name: 'Express Wash', price: 20.00, duration: 30, category: 'Express' },
    { id: 4, name: 'Ironing Service', price: 12.00, duration: 45, category: 'Basic' },
    { id: 5, name: 'Stain Removal', price: 30.00, duration: 90, category: 'Specialty' }
  ]);

  // Order state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [showBill, setShowBill] = useState(false);
  const [orders, setOrders] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchService, setSearchService] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState('');
  const [customerPayments, setCustomerPayments] = useState([]);

  // Load orders from memory on component mount
  useEffect(() => {
    const sampleOrders = [
      {
        id: 1,
        orderNumber: 'ORD-001',
        customerId: 1,
        customer: customers[0],
        items: [{ id: 1, service: services[0], quantity: 2, price: 15.00 }],
        subtotal: 30.00,
        vatAmount: 1.50,
        total: 31.50,
        amountPaid: 31.50,
        paymentMethod: 'cash',
        status: 'in_progress',
        deliveryStatus: 'pending',
        paymentStatus: 'paid',
        createdAt: new Date().toISOString()
      }
    ];
    
    const samplePayments = [
      {
        id: 1,
        customerId: 1,
        amount: 31.50,
        method: 'cash',
        note: 'Initial payment',
        date: new Date().toISOString(),
        orderId: 1
      }
    ];
    
    setOrders(sampleOrders);
    setCustomerPayments(samplePayments);
    updateCustomerBalances(sampleOrders, samplePayments);
  }, []);

  // Update customer balances based on orders and payments
  const updateCustomerBalances = (orders, payments) => {
    const updatedCustomers = customers.map(customer => {
      const customerOrders = orders.filter(order => order.customerId === customer.id);
      const customerPayments = payments.filter(payment => payment.customerId === customer.id);
      
      const totalOrdersAmount = customerOrders.reduce((sum, order) => sum + order.total, 0);
      const totalPaymentsAmount = customerPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      return {
        ...customer,
        balance: totalOrdersAmount - totalPaymentsAmount
      };
    });
    
    return updatedCustomers;
  };

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatAmount = subtotal * 0.05; // 5% VAT
  const total = subtotal + vatAmount;

  // Filtered customers and services
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.phone.includes(searchCustomer)
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchService.toLowerCase()) ||
    service.category.toLowerCase().includes(searchService.toLowerCase())
  );

  const addService = (service) => {
    const existingItem = orderItems.find(item => item.serviceId === service.id);
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.serviceId === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        id: Date.now(),
        serviceId: service.id,
        service,
        quantity: 1,
        price: service.price
      }]);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const updatePrice = (itemId, price) => {
    setOrderItems(orderItems.map(item =>
      item.id === itemId ? { ...item, price: parseFloat(price) || 0 } : item
    ));
  };

  const removeItem = (itemId) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const generateOrderNumber = () => {
    return `ORD-${String(orders.length + 1).padStart(3, '0')}`;
  };

  const createOrder = () => {
    if (!selectedCustomer || orderItems.length === 0) {
      alert('Please select a customer and add at least one service');
      return;
    }

    const customer = customers.find(c => c.id === parseInt(selectedCustomer));
    const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
    
    const newOrder = {
      id: Date.now(),
      orderNumber: generateOrderNumber(),
      customerId: customer.id,
      customer,
      items: [...orderItems],
      subtotal,
      vatAmount,
      total,
      amountPaid: parseFloat(amountPaid) || 0,
      paymentMethod,
      status: 'in_progress',
      deliveryStatus,
      paymentStatus,
      createdAt: new Date().toISOString()
    };
let newPayment = 0
    // Record payment if any amount was paid
    if (amountPaid > 0) {
       newPayment = {
        id: Date.now(),
        customerId: customer.id,
        amount: parseFloat(amountPaid),
        method: paymentMethod,
        note: `Payment for order ${newOrder.orderNumber}`,
        date: new Date().toISOString(),
        orderId: newOrder.id
      };
      setCustomerPayments([...customerPayments, newPayment]);
    }

    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    setCurrentOrderId(newOrder.id);
    setShowBill(true);
    
    // Update customer balances
    const updatedCustomers = updateCustomerBalances(updatedOrders, amountPaid > 0 ? [...customerPayments, newPayment] : customerPayments);
    // Note: In a real app, you would set the customers state here
  };

  const resetOrder = () => {
    setSelectedCustomer('');
    setOrderItems([]);
    setShowBill(false);
    setCurrentOrderId(null);
    setAmountPaid(0);
    setPaymentMethod('cash');
    setDeliveryStatus('pending');
  };

  const printBill = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Trash2 }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status] || config.pending}`}>
        <DollarSign className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  const getDeliveryStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: Trash2 }
    };
    
    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const handleAddPayment = () => {
    if (!currentOrderId) return;
    
    const order = orders.find(o => o.id === currentOrderId);
    if (!order) return;
    
    const newPayment = {
      id: Date.now(),
      customerId: order.customerId,
      amount: parseFloat(paymentAmount),
      method: paymentMethod,
      note: paymentNote || `Payment for order ${order.orderNumber}`,
      date: new Date().toISOString(),
      orderId: order.id
    };
    
    // Update payments
    const updatedPayments = [...customerPayments, newPayment];
    setCustomerPayments(updatedPayments);
    
    // Update order payment status
    const updatedOrders = orders.map(o => {
      if (o.id === order.id) {
        const newAmountPaid = o.amountPaid + parseFloat(paymentAmount);
        return {
          ...o,
          amountPaid: newAmountPaid,
          paymentStatus: newAmountPaid >= o.total ? 'paid' : 'partial'
        };
      }
      return o;
    });
    
    setOrders(updatedOrders);
    setShowPaymentModal(false);
    setPaymentAmount(0);
    setPaymentNote('');
    
    // Update customer balances
    const updatedCustomers = updateCustomerBalances(updatedOrders, updatedPayments);
    // Note: In a real app, you would set the customers state here
  };

  const currentOrder = orders.find(order => order.id === currentOrderId);
  const currentCustomer = currentOrder ? customers.find(c => c.id === currentOrder.customerId) : null;
  const customerOrderHistory = currentCustomer ? orders.filter(o => o.customerId === currentCustomer.id) : [];
  const customerPaymentHistory = currentCustomer ? customerPayments.filter(p => p.customerId === currentCustomer.id) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="text-blue-600" />
                Order Management System
              </h1>
              <p className="text-gray-600 mt-2">Create and manage service orders with UAE VAT compliance</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetOrder}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Reset Order
              </button>
              <button
                onClick={createOrder}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Create Order
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Order Creation Panel */}
          <div className="xl:col-span-2 space-y-6">
            {/* Customer Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="text-blue-600" />
                Select Customer
              </h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search customers by name, code, or phone..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer.id.toString())}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCustomer === customer.id.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                        <p className="text-sm text-gray-600">{customer.customerCode}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{customer.phone}</span>
                        </div>
                        <div className="mt-2">
                          <span className={`text-sm font-medium ${
                            customer.balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            Balance: AED {customer.balance.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {selectedCustomer === customer.id.toString() && (
                        <CheckCircle className="text-blue-500" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Services</h2>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={searchService}
                    onChange={(e) => setSearchService(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-1">
                          {service.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-green-600">
                        AED {service.price.toFixed(2)}
                      </div>
                      <button
                        onClick={() => addService(service)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors text-sm"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Panel */}
          <div className="space-y-6">
            {/* Current Order */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {selectedCustomer && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Customer:</p>
                  <p className="font-semibold text-gray-900">
                    {customers.find(c => c.id === parseInt(selectedCustomer))?.name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Balance: AED {customers.find(c => c.id === parseInt(selectedCustomer))?.balance.toFixed(2)}
                  </p>
                </div>
              )}

              {orderItems.length > 0 ? (
                <div className="space-y-4">
                  <div className="max-h-64 overflow-y-auto">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.service.name}</h4>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                                className="w-16 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                min="1"
                              />
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-gray-600">AED</span>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => updatePrice(item.id, e.target.value)}
                                className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="font-semibold text-gray-900">
                            AED {(item.price * item.quantity).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 mt-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment and Delivery Options */}
                  <div className="border-t pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (AED)</label>
                        <input
                          type="number"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          step="0.01"
                          min="0"
                          max={total}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="cash">Cash</option>
                          <option value="card">Card</option>
                          <option value="bank_transfer">Bank Transfer</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                      <select
                        value={deliveryStatus}
                        onChange={(e) => setDeliveryStatus(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>AED {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>VAT (5%):</span>
                      <span>AED {vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                      <span>Total:</span>
                      <span>AED {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Amount Paid:</span>
                      <span>AED {(amountPaid||0)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Balance Due:</span>
                      <span className={total - amountPaid > 0 ? 'text-red-600' : 'text-green-600'}>
                        AED {(total - (amountPaid||0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No services added yet</p>
                  <p className="text-sm">Select services to add to your order</p>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {orders.slice(-5).reverse().map((order) => (
                  <div 
                    key={order.id} 
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setCurrentOrderId(order.id);
                      setShowBill(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">{order.customer.name}</p>
                      </div>
                      <p className="font-semibold text-green-600">AED {order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bill Modal */}
        {showBill && currentOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Bill Header */}
                <div className="text-center mb-6 border-b pb-6">
                  <h1 className="text-2xl font-bold text-gray-900">SERVICE INVOICE</h1>
                  <p className="text-gray-600 mt-2">UAE VAT Registered Business</p>
                  <p className="text-sm text-gray-500">TRN: 123456789012345</p>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                    <p className="text-gray-800">{currentOrder.customer.name}</p>
                    <p className="text-gray-600">{currentOrder.customer.phone}</p>
                    <p className="text-gray-600">{currentOrder.customer.email}</p>
                    <p className="text-gray-600">{currentOrder.customer.address}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold">Order Number:</span> {currentOrder.orderNumber}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(currentOrder.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Status:</span> {getStatusBadge(currentOrder.status)}</p>
                    <p><span className="font-semibold">Delivery:</span> {getDeliveryStatusBadge(currentOrder.deliveryStatus)}</p>
                    <p><span className="font-semibold">Payment:</span> {getPaymentStatusBadge(currentOrder.paymentStatus)}</p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-left">Service</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Rate (AED)</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">{item.service.name}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{item.price.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64">
                    <div className="flex justify-between py-2 border-b">
                      <span>Subtotal:</span>
                      <span>AED {currentOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span>VAT (5%):</span>
                      <span>AED {currentOrder.vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold text-lg">
                      <span>Total:</span>
                      <span>AED {currentOrder.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-t">
                      <span>Amount Paid:</span>
                      <span>AED {currentOrder.amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium">
                      <span>Balance Due:</span>
                      <span className={currentOrder.total - currentOrder.amountPaid > 0 ? 'text-red-600' : 'text-green-600'}>
                        AED {(currentOrder.total - currentOrder.amountPaid).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Balance */}
                {currentCustomer && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">Customer Balance</h4>
                        <p className="text-sm text-gray-600">All orders combined</p>
                      </div>
                      <p className={`text-lg font-bold ${
                        currentCustomer.balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        AED {currentCustomer.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {customerPaymentHistory.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Payment History</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Method</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerPaymentHistory.map((payment, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-sm font-medium text-green-600">AED {payment.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{payment.method.replace('_', ' ')}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{payment.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Order History */}
                {customerOrderHistory.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Order History</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Order #</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Total</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Payment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerOrderHistory.map((order, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-2 text-sm font-medium text-green-600">AED {order.total.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm">{getStatusBadge(order.status)}</td>
                              <td className="px-4 py-2 text-sm">{getPaymentStatusBadge(order.paymentStatus)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-600 border-t pt-4">
                  <p>Thank you for choosing our services!</p>
                  <p>For any queries, please contact us at support@company.com</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
                  <div>
                    {currentOrder.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <DollarSign size={16} />
                        Add Payment
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={printBill}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Printer size={16} />
                      Print
                    </button>
                    <button
                      onClick={() => setShowBill(false)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Eye size={16} />
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && currentOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="text-green-600" />
                  Add Payment
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (AED)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      step="0.01"
                      min="0.01"
                      max={currentOrder.total - currentOrder.amountPaid}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum: AED {(currentOrder.total - currentOrder.amountPaid).toFixed(2)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                    <textarea
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows="2"
                      placeholder="Payment reference or notes"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPayment}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                    >
                      <CheckCircle size={16} />
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagementSystem;