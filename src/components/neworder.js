import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, User, FileText, Printer, Eye, CheckCircle, Clock, DollarSign, Search, Phone } from 'lucide-react';
import db from './db';

const OrderManagementSystem = () => {
  // States
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [showBill, setShowBill] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchService, setSearchService] = useState('');
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [status, setStatus] = useState('pending');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentNote, setPaymentNote] = useState('');
  const [customerPayments, setCustomerPayments] = useState([]);

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatAmount = subtotal * 0.05;
  const total = subtotal + vatAmount;

  // Filter customers and services
  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.customerId.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.phoneNumber.includes(searchCustomer)
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchService.toLowerCase()) ||
    service.category.toLowerCase().includes(searchService.toLowerCase())
  );

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const [customers, services, orders, payments] = await Promise.all([
        db.customers.toArray(),
        db.services.toArray(),
        db.orders.toArray(),
        db.payments.toArray()
      ]);
      
      // Get order details
      const ordersWithDetails = await Promise.all(orders.map(async order => {
        const [customer, items] = await Promise.all([
          db.customers.get(order.customerId),
          db.orderItems.where('orderId').equals(order.id).toArray()
        ]);

        const itemsWithServices = await Promise.all(items.map(async item => {
          const service = await db.services.get(item.serviceId);
          return { ...item, service };
        }));

        return { ...order, customer, items: itemsWithServices };
      }));

      setCustomers(customers);
      setServices(services);
      setOrders(ordersWithDetails);
      setCustomerPayments(payments);
    };

    loadData();
  }, []);

  // Service functions
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

  // Create order function with Dexie
  const createOrder = async () => {
    if (!selectedCustomer || orderItems.length === 0) {
      alert('Please select a customer and add at least one service');
      return;
    }

    const customer = customers.find(c => c.id === parseInt(selectedCustomer));
    const paymentStatus = amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';
    
    try {
      // Create order
      const orderId = await db.orders.add({
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        subtotal,
        vatAmount,
        total,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentMethod,
        paymentStatus,
        status,
        deliveryStatus,
        createdAt: new Date().toISOString()
      });

      // Add order items
      await Promise.all(orderItems.map(item => 
        db.orderItems.add({
          orderId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          price: item.price
        })
      ));

      // Update state
      const newOrder = {
        id: orderId,
        orderNumber: generateOrderNumber(),
        customerId: customer.id,
        customer,
        items: [...orderItems],
        subtotal,
        vatAmount,
        total,
        amountPaid: parseFloat(amountPaid) || 0,
        paymentMethod,
        paymentStatus,
        status,
        deliveryStatus,
        createdAt: new Date().toISOString()
      };

      setOrders([...orders, newOrder]);
      setCurrentOrderId(orderId);
      setShowBill(true);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  // Status badge functions
  const getStatusBadge = (status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status] || config.pending}`}>
        {status === 'in_progress' ? 'IN PROGRESS' : status.toUpperCase()}
      </span>
    );
  };

  const getDeliveryStatusBadge = (status) => {
    const config = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config[status] || config.pending}`}>
        {status === 'in_progress' ? 'IN PROGRESS' : status.toUpperCase()}
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

  // Reset order
  const resetOrder = () => {
    setSelectedCustomer('');
    setOrderItems([]);
    setShowBill(false);
    setCurrentOrderId(null);
    setAmountPaid(0);
    setStatus('pending');
    setDeliveryStatus('pending');
  };

  // Print bill
  const printBill = () => {
    window.print();
  };

  // Handle payment
  const handleAddPayment = async () => {
    if (!paymentAmount) return;
          const paymentId = `PAY-${Date.now()}`;

    try {
      const order = orders.find(o => o.id === currentOrderId);
      const payment = {
        customerId: order.customerId,
        orderId: currentOrderId,
        paymentId,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        date: new Date().toISOString(),
        note: paymentNote
      };
      
      // Add payment to database
      await db.payments.add(payment);
      
      // Update order payment status
      const newAmountPaid = order.amountPaid + payment.amount;
      const newPaymentStatus = newAmountPaid >= order.total ? 'paid' : 'partial';
      
      await db.orders.update(currentOrderId, {
        amountPaid: newAmountPaid,
        paymentStatus: newPaymentStatus
      });
      
      // Update state
      setCustomerPayments([...customerPayments, payment]);
      setOrders(orders.map(o => 
        o.id === currentOrderId 
          ? { ...o, amountPaid: newAmountPaid, paymentStatus: newPaymentStatus } 
          : o
      ));
      
      setShowPaymentModal(false);
      setPaymentAmount(0);
      setPaymentNote('');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment');
    }
  };

  // Get current data
  const currentOrder = orders.find(order => order.id === currentOrderId);
  const currentCustomer = currentOrder ? customers.find(c => c.id === currentOrder.customerId) : null;
  // const customerOrderHistory = currentCustomer ? orders.filter(o => o.customerId === currentOrder.customerId) : [];
  // const customerPaymentHistory = currentCustomer ? customerPayments.filter(p => p.customerId === currentCustomer.id) : [];
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
                        <p className="text-sm text-gray-600">{customer.customerId}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-sm text-gray-600">{customer.phoneNumber}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-xs text-gray-500">Vehicle: {customer.vehicleNumber}</span>
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
                        <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full mt-2">
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
                    Vehicle: {customers.find(c => c.id === parseInt(selectedCustomer))?.vehicleNumber}
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
                    {/* <div className="grid grid-cols-2 gap-3">
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
                    </div> */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Status</label>
                      <select
                        value={deliveryStatus}
                        onChange={(e) => setStatus(e.target.value)}
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
                  
                    {/* <div className="flex justify-between text-gray-600">
                      <span>Amount Paid:</span>
                      <span>AED {(parseFloat(amountPaid) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-medium">
                      <span>Balance Due:</span>
                      <span>AED {(total - (parseFloat(amountPaid) || 0)).toFixed(2)}</span>
                    </div> */}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No services added yet</p>
              )}
            </div>

            {/* Order History */}


            {orderItems.length  <= 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
              
              {orders.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {orders.slice(-5).reverse().map((order) => (
                    <div key={order.id} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.customer?.name || 'Unknown Customer'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            AED {order.totalAmount?.toFixed(2) || '0.00'}
                          </p>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                      
                      {/* <div className="flex gap-2 text-xs">
                        {getPaymentStatusBadge(order.paymentStatus || 'pending')}
                        {getDeliveryStatusBadge(order.deliveryStatus || 'pending')}
                      </div> */}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No orders yet</p>
              )}
            </div>
            ):(
              <div></div>
            )}
          </div>
        </div>

        {/* Bill Modal */}
        {showBill && currentOrder && currentCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6 print:p-0">
                {/* Bill Header */}
                <div className="flex justify-between items-center mb-6 print:mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Invoice</h2>
                  <div className="flex gap-2 print:hidden">
                    <button
                      onClick={printBill}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Printer size={20} />
                      Print
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <DollarSign size={20} />
                      Add Payment
                    </button>
                    <button
                      onClick={() => setShowBill(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Company Info */}
                <div className="mb-6 border-b pb-4">
                  <h1 className="text-2xl font-bold text-blue-600">LaundryPro Services</h1>
                  <p className="text-gray-600">Professional Laundry & Dry Cleaning</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Dubai, UAE | TRN: 123456789012345 | Tel: +971-4-1234567
                  </p>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                    <div className="text-gray-700">
                      <p className="font-medium">{currentCustomer.name}</p>
                      <p className="text-sm">{currentCustomer.customerId}</p>
                      <p className="text-sm">{currentCustomer.phoneNumber}</p>
                      <p className="text-sm">{currentCustomer.address}</p>
                      <p className="text-sm">Vehicle: {currentCustomer.vehicleNumber}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Invoice #</p>
                      <p className="font-bold text-lg">INV-{String(currentOrder.id).padStart(4, '0')}</p>
                      <p className="text-sm text-gray-600 mt-2">Date</p>
                      <p className="font-medium">{new Date(currentOrder.createdAt).toLocaleDateString()}</p>
                      <div className="mt-3 space-y-1">
                        {getStatusBadge(currentOrder.status)}
                        {/* {getPaymentStatusBadge(currentOrder.paymentStatus || 'pending')}
                        {getDeliveryStatusBadge(currentOrder.deliveryStatus || 'pending')} */}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-6">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-left">Service</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Rate (AED)</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Amount (AED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-4 py-2">
                            <div>
                              <p className="font-medium">{item.service?.name || 'Service'}</p>
                              <p className="text-sm text-gray-600">{item.service?.description}</p>
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right">{item.price.toFixed(2)}</td>
                          <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                            {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-6">
                  <div className="w-64">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>AED {currentOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VAT (5%):</span>
                        <span>AED {currentOrder.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>AED {currentOrder.total.toFixed(2)}</span>
                      </div>
                      {/* <div className="flex justify-between text-green-600">
                        <span>Amount Paid:</span>
                        <span>AED {currentOrder.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-medium">
                        <span>Balance Due:</span>
                        <span>AED {(currentOrder.total - currentOrder.amountPaid).toFixed(2)}</span>
                      </div> */}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                {/* <div className="mb-6 text-sm text-gray-600">
                  <p><strong>Payment Method:</strong> {currentOrder.paymentMethod?.toUpperCase() || 'N/A'}</p>
                </div> */}

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-gray-500">
                  <p>Thank you for choosing LaundryPro Services!</p>
                  <p>This is a computer-generated invoice and does not require a signature.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Amount (AED)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                      max={currentOrder ? (currentOrder.total - currentOrder.amountPaid) : 0}
                      placeholder="0.00"
                    />
                    {currentOrder && (
                      <p className="text-sm text-gray-500 mt-1">
                        Remaining balance: AED {(currentOrder.total - currentOrder.amountPaid).toFixed(2)}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Note (Optional)
                    </label>
                    <textarea
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Add any notes about this payment..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPayment}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          @page {
            margin: 1in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderManagementSystem;