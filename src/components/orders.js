import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  FileText, 
  Printer, 
  Eye, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Search, 
  Calendar, 
  Phone, 
  Mail,
  Edit3,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

const OrdersManagementScreen = () => {
  // Sample data
  const [customers] = useState([
    { id: 1, customerCode: 'CUST001', name: 'Ahmed Al Mansouri', phone: '+971 50 123 4567', email: 'ahmed@email.com', address: 'Dubai Marina, UAE' },
    { id: 2, customerCode: 'CUST002', name: 'Sara Abdullah', phone: '+971 55 987 6543', email: 'sara@email.com', address: 'Jumeirah, Dubai, UAE' },
    { id: 3, customerCode: 'CUST003', name: 'Mohamed Hassan', phone: '+971 52 456 7890', email: 'mohamed@email.com', address: 'Abu Dhabi, UAE' }
  ]);

  const [services] = useState([
    { id: 1, name: 'Wash & Fold', price: 15.00, duration: 60, category: 'Basic' },
    { id: 2, name: 'Dry Cleaning', price: 25.00, duration: 120, category: 'Premium' },
    { id: 3, name: 'Express Wash', price: 20.00, duration: 30, category: 'Express' },
    { id: 4, name: 'Ironing Service', price: 12.00, duration: 45, category: 'Basic' },
    { id: 5, name: 'Stain Removal', price: 30.00, duration: 90, category: 'Specialty' }
  ]);

  // State management
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Load orders from localStorage on component mount
  useEffect(() => {
    const savedOrders = JSON.parse(window.localStorage?.getItem('orders') || '[]');
    if (savedOrders.length === 0) {
      // Initialize with sample data if no orders exist
      const sampleOrders = [
        {
          id: 1,
          orderNumber: 'ORD-001',
          customerId: 1,
          customer: customers[0],
          items: [
            { id: 1, service: services[0], quantity: 2, price: 15.00 },
            { id: 2, service: services[3], quantity: 1, price: 12.00 }
          ],
          subtotal: 42.00,
          vatAmount: 2.10,
          total: 44.10,
          status: 'in_progress',
          paymentStatus: 'pending',
          createdAt: new Date().toISOString(),
          notes: 'Customer requested express delivery'
        },
        {
          id: 2,
          orderNumber: 'ORD-002',
          customerId: 2,
          customer: customers[1],
          items: [
            { id: 3, service: services[1], quantity: 1, price: 25.00 }
          ],
          subtotal: 25.00,
          vatAmount: 1.25,
          total: 26.25,
          status: 'ready',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          notes: ''
        },
        {
          id: 3,
          orderNumber: 'ORD-003',
          customerId: 3,
          customer: customers[2],
          items: [
            { id: 4, service: services[2], quantity: 3, price: 20.00 },
            { id: 5, service: services[4], quantity: 1, price: 30.00 }
          ],
          subtotal: 90.00,
          vatAmount: 4.50,
          total: 94.50,
          status: 'completed',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          notes: 'Stain removal successful'
        }
      ];
      setOrders(sampleOrders);
      saveOrders(sampleOrders);
    } else {
      setOrders(savedOrders);
    }
  }, []);

  // Save orders to localStorage
  const saveOrders = (ordersToSave) => {
    try {
      // Using memory storage instead of localStorage for Claude.ai compatibility
      window.ordersStorage = ordersToSave;
    } catch (error) {
      console.warn('Storage not available, keeping data in memory');
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      const daysDiff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          matchesDate = daysDiff === 0;
          break;
        case 'week':
          matchesDate = daysDiff <= 7;
          break;
        case 'month':
          matchesDate = daysDiff <= 30;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  // Update order status
  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  // Update payment status
  const updatePaymentStatus = (orderId, newPaymentStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order
    );
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  // Delete order
  const deleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      const updatedOrders = orders.filter(order => order.id !== orderId);
      setOrders(updatedOrders);
      saveOrders(updatedOrders);
    }
  };

  // Print invoice
  const printInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Get status badge
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

  // Get payment status badge
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="text-blue-600" />
                Orders Management
              </h1>
              <p className="text-gray-600 mt-2">View, manage, and track all service orders</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Plus size={20} />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders, customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Payments</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                AED {filteredOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {filteredOrders.filter(order => order.paymentStatus === 'pending').length}
              </p>
              <p className="text-sm text-gray-600">Pending Payment</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {filteredOrders.filter(order => order.status === 'in_progress').length}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        {order.notes && (
                          <div className="text-xs text-gray-400 mt-1 max-w-32 truncate">
                            {order.notes}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                        <div className="text-sm text-gray-500">{order.customer.customerCode}</div>
                        <div className="text-sm text-gray-500">{order.customer.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{item.service.name}</span>
                            <span className="text-gray-500">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        AED {order.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        VAT: AED {order.vatAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded p-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="mt-1">
                        {getStatusBadge(order.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                        className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded p-1"
                      >
                        <option value="pending">Pending</option>
                        <option value="partial">Partial</option>
                        <option value="paid">Paid</option>
                      </select>
                      <div className="mt-1">
                        {getPaymentStatusBadge(order.paymentStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => printInvoice(order)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Print Invoice"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowInvoice(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Delete Order"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <FileText size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Invoice Modal */}
        {showInvoice && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                {/* Invoice Header */}
                <div className="text-center mb-8 border-b pb-6">
                  <h1 className="text-3xl font-bold text-gray-900">SERVICE INVOICE</h1>
                  <p className="text-gray-600 mt-2">UAE VAT Registered Business</p>
                  <p className="text-sm text-gray-500">TRN: 123456789012345</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Al Laundry Services LLC</p>
                    <p>Dubai, United Arab Emirates</p>
                    <p>Tel: +971 4 123 4567 | Email: info@allaundry.ae</p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">Bill To:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">{selectedOrder.customer.name}</p>
                      <p className="text-gray-600 mt-1">{selectedOrder.customer.customerCode}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-gray-600">{selectedOrder.customer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-gray-600">{selectedOrder.customer.email}</span>
                      </div>
                      <p className="text-gray-600 mt-2">{selectedOrder.customer.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="mb-2"><span className="font-semibold">Invoice Number:</span> {selectedOrder.orderNumber}</p>
                      <p className="mb-2"><span className="font-semibold">Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                      <p className="mb-2"><span className="font-semibold">Status:</span> {getStatusBadge(selectedOrder.status)}</p>
                      <p><span className="font-semibold">Payment:</span> {getPaymentStatusBadge(selectedOrder.paymentStatus)}</p>
                    </div>
                  </div>
                </div>

                {/* Services Table */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg">Services</h3>
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Service</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Quantity</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Rate (AED)</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amount (AED)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">{item.service.name}</p>
                                <p className="text-sm text-gray-500">{item.service.category}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-gray-900">{item.price.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              {(item.price * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-80">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex justify-between py-2 text-gray-700">
                        <span>Subtotal:</span>
                        <span>AED {selectedOrder.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-gray-700 border-b border-gray-200">
                        <span>VAT (5%):</span>
                        <span>AED {selectedOrder.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-3 font-bold text-xl text-gray-900">
                        <span>Total Amount:</span>
                        <span>AED {selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-gray-600 border-t pt-6">
                  <p className="font-medium">Thank you for choosing our services!</p>
                  <p className="mt-2">For any queries, please contact us at support@allaundry.ae</p>
                  <p className="mt-2 text-xs">This is a computer-generated invoice and does not require a signature.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t no-print">
                  <button
                    onClick={() => setShowInvoice(false)}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Printer size={18} />
                    Print Invoice
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
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
          }
          .fixed {
            position: relative !important;
            inset: auto !important;
          }
          .bg-black {
            background: transparent !important;
          }
          .max-h-\\[90vh\\] {
            max-height: none !important;
          }
          .overflow-y-auto {
            overflow: visible !important;
          }
        }
      `}</style>
      </div>

      )}

      export default OrdersManagementScreen;