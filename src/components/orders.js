import React, { useState, useEffect } from 'react';
import { 
  Plus, 
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
  Edit3,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import db from './db'; // Import the Dexie database instance

const OrdersManagementScreen = () => {
  const navigate = useNavigate();

  // State management
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [editingOrder, setEditingOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load data from IndexedDB on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, servicesData, ordersData] = await Promise.all([
          db.customers.toArray(),
          db.services.toArray(),
          db.orders.toArray()
        ]);

        // Map customer and service data to orders
        const enrichedOrders = await Promise.all(ordersData.map(async order => {
          const customer = customersData.find(c => c.id === order.customerId) || {};
          const orderItems = await db.orderItems.where('orderId').equals(order.id).toArray();
          
          const items = await Promise.all(orderItems.map(async item => {
            const service = servicesData.find(s => s.id === item.serviceId) || {};
            return {
              ...item,
              service
            };
          }));

          return {
            ...order,
            customer,
            items
          };
        }));

        setCustomers(customersData);
        setServices(servicesData);
        setOrders(enrichedOrders);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
      (order.customer?.phoneNumber?.includes(searchTerm) ?? false);

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const orderDate = new Date(order.createdAt);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      if (startDate && orderDate < startDate) matchesDate = false;
      if (endDate && orderDate > endDate) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await db.orders.update(orderId, { status: newStatus });
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Delete order
  const deleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        await db.transaction('rw', db.orders, db.orderItems, async () => {
          await db.orders.delete(orderId);
          await db.orderItems.where('orderId').equals(orderId).delete();
        });
        
        setOrders(orders.filter(order => order.id !== orderId));
      } catch (error) {
        console.error('Error deleting order:', error);
      }
    }
  };

  // Print invoice
  // const printInvoice = (order) => {
  //   setSelectedOrder(order);
  //   setShowInvoice(true);
  //   setTimeout(() => {
  //     window.print();
  //   }, 100);
  // };


  async function printInvoice(order) {
        setSelectedOrder(order);
    setShowInvoice(true);
    try {
        const success = await window.electronAPI.printTextReceipt(order);
        if (success) {
            alert('Receipt printed successfully!');
        } else {
            alert('Failed to print receipt');
        }
    } catch (error) {
        console.error('Printing error:', error);
        alert('Error while printing receipt');
    }
}
  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      ready: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
            delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },

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

  // Export to Excel
  const exportToExcel = () => {
    const dataToExport = filteredOrders.map(order => {
      return {
        'Order Number': order.orderNumber,
        'Customer': order.customer?.name || 'N/A',
        'Phone': order.customer?.phoneNumber || 'N/A',
        'Date': new Date(order.createdAt).toLocaleDateString(),
        'Subtotal': order.subtotal.toFixed(2),
        'VAT': order.vatAmount.toFixed(2),
        'Total': order.total.toFixed(2),
        'Status': order.status.replace('_', ' ').toUpperCase(),
        'Notes': order.notes || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Generate filename with date range if specified
    let filename = 'Orders';
    if (dateRange.start || dateRange.end) {
      const start = dateRange.start ? new Date(dateRange.start).toLocaleDateString() : '';
      const end = dateRange.end ? new Date(dateRange.end).toLocaleDateString() : '';
      filename += `_${start}_to_${end}`;
    }
    filename += '.xlsx';
    
    XLSX.writeFile(workbook, filename);
  };

  // Calculate dashboard metrics
const calculateMetrics = () => {
  const metrics = {
    totalOrders: 0,
    totalSubtotal: 0,
    totalVat: 0,
    totalSales: 0,
    pendingDelivery: 0
  };

  filteredOrders.forEach(order => {
    const status = order.status?.toLowerCase?.();

    // Skip cancelled orders entirely
    if (status === 'cancelled') return;

    metrics.totalOrders++;
    metrics.totalSubtotal += order.subtotal || 0;
    metrics.totalVat += order.vatAmount || 0;
    metrics.totalSales += order.total || 0;

    if (!['completed', 'delivered'].includes(status)) {
      metrics.pendingDelivery++;
    }
  });

  return metrics;
};


  const metrics = calculateMetrics();

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="">
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
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                onClick={() => navigate('/neworder')}
              >
                <Plus size={20} />
                New Order
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Export Button */}
            <div>
              <button
                onClick={() => exportToExcel()}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          {/* Date Range Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-2xl font-bold text-gray-900">{metrics.totalOrders}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-2xl font-bold text-blue-600">
                AED {metrics.totalSubtotal.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Subtotal</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-2xl font-bold text-purple-600">
                AED {metrics.totalVat.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">VAT Amount</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-2xl font-bold text-green-600">
                AED {metrics.totalSales.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Sales</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-xs">
              <p className="text-2xl font-bold text-yellow-600">
                {metrics.pendingDelivery}
              </p>
              <p className="text-sm text-gray-600">Pending Delivery</p>
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
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (AED)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customer?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{order.customer?.phoneNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.total.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Sub: {order.subtotal.toFixed(2)} | VAT: {order.vatAmount.toFixed(2)}
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
                                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="mt-1">
                        {getStatusBadge(order.status)}
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

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * rowsPerPage, filteredOrders.length)}
                </span>{' '}
                of <span className="font-medium">{filteredOrders.length}</span> results
              </span>
              
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
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
                {/* <div className="text-center mb-8 border-b pb-6">
                  <h1 className="text-3xl font-bold text-gray-900">SERVICE INVOICE</h1>
                  <p className="text-gray-600 mt-2">UAE VAT Registered Business</p>
                  <p className="text-sm text-gray-500">TRN: 123456789012345</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>Al Laundry Services LLC</p>
                    <p>Dubai, United Arab Emirates</p>
                    <p>Tel: +971 4 123 4567 | Email: info@allaundry.ae</p>
                  </div>
                </div> */}

                {/* Order Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 text-lg">Bill To:</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-800">{selectedOrder.customer?.name || 'N/A'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-gray-600">{selectedOrder.customer?.phoneNumber || 'N/A'}</span>
                      </div>
                      <p className="text-gray-600 mt-2">{selectedOrder.customer?.address || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="mb-2"><span className="font-semibold">Invoice Number:</span> {selectedOrder.orderNumber}</p>
                      <p className="mb-2"><span className="font-semibold">Date:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                      <p><span className="font-semibold">Status:</span> {getStatusBadge(selectedOrder.status)}</p>
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
                                <p className="font-medium text-gray-900">{item.service?.name || 'N/A'}</p>
                                <p className="text-sm text-gray-500">{item.service?.category || 'N/A'}</p>
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
                      <div className="flex justify-between py-2 text-gray-700">
                        <span>VAT (5%):</span>
                        <span>AED {selectedOrder.vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 font-bold text-lg text-gray-900 border-t border-gray-200 mt-2 pt-2">
                        <span>Total:</span>
                        <span>AED {selectedOrder.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-900 mb-2 text-lg">Notes</h3>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-gray-800">{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                {/* <div className="border-t pt-6 text-center text-sm text-gray-500">
                  <p>Thank you for your business!</p>
                  <p className="mt-2">For any inquiries, please contact us at +971 4 123 4567 or email info@allaundry.ae</p>
                  <p className="mt-4 font-medium">Terms & Conditions:</p>
                  <p className="mt-1">1. Payment is due upon receipt of this invoice</p>
                  <p>2. Items not claimed within 30 days will be donated to charity</p>
                </div> */}
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-4 border-t">
                <button
                  onClick={() => setShowInvoice(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Printer size={16} />
                  Print Invoice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersManagementScreen;