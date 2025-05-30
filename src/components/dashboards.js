import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBagIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlusCircleIcon,
  UserPlusIcon,
  DocumentTextIcon,
  BanknotesIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import db from './db'; // Import your Dexie database

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingReturns: 0,
    outstandingPayments: 0,
    activeCustomers: 0
  });

  const [pendingOrders, setPendingOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const ordersPerPage = 5;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Get all data from Dexie
      const orders = await db.orders.toArray();
      const customers = await db.customers.toArray();
      const payments = await db.payments.toArray();

      // Calculate today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate stats
      const todayOrders = orders.filter(order => 
        new Date(order.createdAt).toISOString().split('T')[0] === today
      ).length;

      const pendingReturns = orders.filter(order => 
        order.status === 'pending' 
      ).length;

      const outstandingPayments = orders.reduce((total, order) => {
        if (order.paymentStatus !== 'paid') {
          return total + (order.total - order.amountPaid || 0);
        }
        return total;
      }, 0);

      const activeCustomers = customers.length;

      // Filter pending orders (excluding delivered)
      const pendingOrdersData = orders.filter(order => 
        order.status !== 'delivered' && order.status !== 'completed'
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Enrich orders with customer data
      const enrichedOrders = await Promise.all(
        pendingOrdersData.map(async (order) => {
          const customer = await db.customers.get(order.customerId);
          return {
            ...order,
            customerName: customer?.name || 'Unknown Customer',
            customerPhone: customer?.phoneNumber || ''
          };
        })
      );

      setStats({
        todayOrders,
        pendingReturns,
        outstandingPayments,
        activeCustomers
      });

      setPendingOrders(enrichedOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const order = await db.orders.get(orderId);
      const customer = await db.customers.get(order.customerId);
      const orderItems = await db.orderItems.where('orderId').equals(orderId).toArray();
      
      // Get service details for each order item
      const enrichedItems = await Promise.all(
        orderItems.map(async (item) => {
          const service = await db.services.get(item.serviceId);
          return {
            ...item,
            serviceName: service?.name || 'Unknown Service',
            serviceDescription: service?.description || ''
          };
        })
      );

      return {
        ...order,
        customer,
        items: enrichedItems
      };
    } catch (error) {
      console.error('Failed to fetch order details:', error);
      return null;
    }
  };

  const handleOrderClick = async (orderId) => {
    const orderDetails = await fetchOrderDetails(orderId);
    if (orderDetails) {
      setSelectedOrder(orderDetails);
      setIsModalOpen(true);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await db.orders.update(orderId, { status: newStatus });
      
      // Refresh data
      await fetchData();
      
      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = await fetchOrderDetails(orderId);
        setSelectedOrder(updatedOrder);
      }
      
      setIsUpdatingStatus(false);
    } catch (error) {
      console.error('Failed to update order status:', error);
      setIsUpdatingStatus(false);
    }
  };

  // Get current orders for pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = pendingOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(pendingOrders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Today's Orders" 
              value={stats.todayOrders} 
              icon={<ShoppingBagIcon className="h-6 w-6 text-blue-500" />}
              color="blue"
            />
            <StatCard 
              title="Pending Returns" 
              value={stats.pendingReturns} 
              icon={<ArrowPathIcon className="h-6 w-6 text-amber-500" />}
              color="amber"
            />
            <StatCard 
              title="Outstanding Payments" 
              value={`AED ${stats.outstandingPayments.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`} 
              icon={<CurrencyDollarIcon className="h-6 w-6 text-emerald-500" />}
              color="emerald"
            />
            <StatCard 
              title="Active Customers" 
              value={stats.activeCustomers} 
              icon={<UsersIcon className="h-6 w-6 text-indigo-500" />}
              color="indigo"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionButton 
                icon={<PlusCircleIcon className="h-5 w-5" />}
                label="New Order"
                onClick={() => navigate('/neworder')}
                color="blue"
              />
              <ActionButton 
                icon={<UserPlusIcon className="h-5 w-5" />}
                label="Customers"
                onClick={() => navigate('/customers')}
                color="green"
              />
              <ActionButton 
                icon={<DocumentTextIcon className="h-5 w-5" />}
                label="Services"
                onClick={() => navigate('/services')}
                color="purple"
              />
              <ActionButton 
                icon={<BanknotesIcon className="h-5 w-5" />}
                label="Payments"
                onClick={() => navigate('/payments')}
                color="gray"
              />
            </div>
          </div>
          
          {/* Pending Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Pending Orders</h2>
              <span className="text-sm text-gray-500">
                {pendingOrders.length} pending orders
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.length > 0 ? (
                    currentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-AE')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          AED {order.total?.toLocaleString('en-AE', { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleOrderClick(order.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No pending orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {pendingOrders.length > ordersPerPage && (
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastOrder, pendingOrders.length)}
                      </span>{' '}
                      of <span className="font-medium">{pendingOrders.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => paginate(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">First</span>
                        &laquo;
                      </button>
                      <button
                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        &lsaquo;
                      </button>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        &rsaquo;
                      </button>
                      <button
                        onClick={() => paginate(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Last</span>
                        &raquo;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onStatusUpdate={handleStatusUpdate}
          isUpdating={isUpdatingStatus}
        />
      )}
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, isOpen, onClose, onStatusUpdate, isUpdating }) => {
  const [newStatus, setNewStatus] = useState(order.status);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'ready', label: 'Ready' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' }
  ];

  const handleStatusChange = () => {
    if (newStatus !== order.status) {
      onStatusUpdate(order.id, newStatus);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Number</label>
              <p className="mt-1 text-sm text-gray-900">{order.orderNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-AE')}
              </p>
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Customer Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{order.customer?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{order.customer?.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Order Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.items?.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.serviceName}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">AED {item.price?.toFixed(2)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">AED {(item.quantity * item.price)?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subtotal</label>
              <p className="mt-1 text-sm text-gray-900">AED {order.subtotal?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">VAT</label>
              <p className="mt-1 text-sm text-gray-900">AED {order.vatAmount?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total</label>
              <p className="mt-1 text-sm font-bold text-gray-900">AED {order.total?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Update Status</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleStatusChange}
                disabled={isUpdating || newStatus === order.status}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper components
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    indigo: 'bg-indigo-50 text-indigo-700'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ icon, label, onClick, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg transition ${colorClasses[color]}`}
    >
      <div className="mb-2">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'processing': 'bg-blue-100 text-blue-800',
    'pending-return': 'bg-amber-100 text-amber-800',
    'ready': 'bg-green-100 text-green-800',
    'delivered': 'bg-gray-100 text-gray-800',
    'completed': 'bg-green-100 text-green-800'
  };
  
  const formatStatus = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {formatStatus(status)}
    </span>
  );
};

export default DashboardScreen;