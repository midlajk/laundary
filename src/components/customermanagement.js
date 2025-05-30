import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from './db';
import {
  UsersIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const CustomerManagementScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Live queries for data
  const customers = useLiveQuery(() => 
    db.customers
      .where('name').startsWithIgnoreCase(searchTerm)
      .or('phoneNumber').startsWithIgnoreCase(searchTerm)
      .or('vehicleNumber').startsWithIgnoreCase(searchTerm)
      .or('customerId').startsWithIgnoreCase(searchTerm)
      .toArray()
  , [searchTerm]);

  const orders = useLiveQuery(() => db.orders.toArray());
  const payments = useLiveQuery(() => db.payments.toArray());

  // Calculate customer statistics
  const getCustomerStats = (customerId) => {
    if (!orders || !payments) return { pendingOrders: 0, pendingAmount: 0 };
    
    const customerOrders = orders.filter(order => order.customerId === customerId);
        const customerpayments = payments.filter(payment => payment.customerId === customerId);
    const pendingOrders = customerOrders.filter(order => 
      order.status !== 'delivered' && order.status !== 'cancelled'
    ).length;
    
    const ordersum = customerOrders.reduce((sum, order) => {
      if (order.status === 'cancelled') return sum;
            return sum + (order.total );
    }, 0);
    const paymentmade = customerpayments.reduce((sum, payment) => {
            return sum + (payment.amount );
    }, 0);

    let  pendingAmount = ordersum-paymentmade
    return { pendingOrders, pendingAmount};
  };

  // Calculate overall statistics
  const totalCustomers = customers?.length || 0;
  const customersWithPendingOrders = customers?.filter(customer => 
    getCustomerStats(customer.id).pendingOrders > 0
  ).length || 0;
  const totalPendingAmount = customers?.reduce((sum, customer) => 
    sum + getCustomerStats(customer.id).pendingAmount, 0
  ) || 0;

  // Generate a new customer ID
  const generateCustomerId = () => {
    if (!customers || customers.length === 0) return 'CUST001';
    
    const maxId = customers.reduce((max, customer) => {
      const num = parseInt(customer.customerId.replace(/\D/g, '')) || 0;
      return Math.max(max, num);
    }, 0);
    
    return `CUST${String(maxId + 1).padStart(3, '0')}`;
  };

  // Handle creating a new customer
  const handleCreateCustomer = async (customerData) => {
    try {
      await db.customers.add({
        ...customerData,
        customerId: customerData.customerId || generateCustomerId(),
        createdAt: new Date()
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to add customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Handle deleting a customer
  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      await db.transaction('rw', db.customers, db.orders, db.payments, async () => {
        // Delete customer's payments first
        await db.payments.where('customerId').equals(customerId).delete();
        // Then delete customer's orders
        await db.orders.where('customerId').equals(customerId).delete();
        // Finally delete the customer
        await db.customers.delete(customerId);
      });
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer. Please try again.');
    }
  };

  // View customer details
  const viewCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UsersIcon className="h-8 w-8 text-blue-600" />
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">Manage customers, track orders and payments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-2xl font-bold text-orange-600">{customersWithPendingOrders}</p>
              <p className="text-xs text-gray-500">customers with pending orders</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-red-600">${totalPendingAmount}</p>
              <p className="text-xs text-gray-500">total outstanding</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search customers by name, phone, vehicle or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers && customers.length > 0 ? (
              customers.map((customer) => {
                const stats = getCustomerStats(customer.id);
                return (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.vehicleNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stats.pendingOrders > 0 ? (
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-1" />
                          <span className="text-sm font-medium text-orange-600">
                            {stats.pendingOrders}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {stats.pendingAmount !=0 ? (
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm font-medium text-red-600">
                            {stats.pendingAmount}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">$0.00</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => viewCustomerDetails(customer)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                 
                        <button 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  {customers ? 'No customers found' : 'Loading customers...'}
                  {searchTerm && customers?.length === 0 && ' Try a different search term.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Add New Customer</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <CustomerForm 
                onSave={handleCreateCustomer} 
                suggestedId={generateCustomerId()}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal 
          customer={selectedCustomer}
          onClose={() => setShowDetailModal(false)}
          orders={orders}
          payments={payments}
        />
      )}
    </div>
  );
};

// Customer Form Component
const CustomerForm = ({ onSave, suggestedId }) => {
  const [formData, setFormData] = useState({
    customerId: suggestedId || '',
    name: '',
    phoneNumber: '',
    vehicleNumber: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.phoneNumber) {
      alert('Please fill in all required fields (Name, Phone Number)');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
          <input
            type="text"
            value={formData.customerId}
            onChange={(e) => setFormData({...formData, customerId: e.target.value.toUpperCase()})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="CUST001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1234567890"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
          <input
            type="text"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({...formData, vehicleNumber: e.target.value.toUpperCase()})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="ABC123"
          />
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => onSave(null)} // Close modal
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Customer
        </button>
      </div>
    </form>
  );
};

// Customer Detail Modal Component
const CustomerDetailModal = ({ customer, onClose, orders, payments }) => {
  const customerOrders = orders?.filter(order => order.customerId === customer.id) || [];
  const customerPayments = payments?.filter(payment => payment.customerId === customer.id) || [];

  // Calculate order totals
  const orderStats = customerOrders.reduce((stats, order) => {
   const orders = customerOrders.length;
   const ordersum = customerOrders.reduce((sum, order) => {
      if (order.status === 'cancelled') return sum;
            return sum + (order.total );
    }, 0);    
     const paymentmade = customerPayments.reduce((sum, payment) => {
            return sum + (payment.amount );
    }, 0);
    return {
      totalOrders: orders,
      totalAmount: ordersum,
      totalPaid: paymentmade,
      totalPending: (ordersum-paymentmade)
    };
  }, { totalOrders: 0, totalAmount: 0, totalPaid: 0, totalPending: 0 });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Customer Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Customer ID</h4>
              <p className="mt-1 text-sm text-gray-900">{customer.customerId}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Name</h4>
              <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Phone Number</h4>
              <p className="mt-1 text-sm text-gray-900">{customer.phoneNumber}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Vehicle Number</h4>
              <p className="mt-1 text-sm text-gray-900">{customer.vehicleNumber || '-'}</p>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Total Orders</h4>
              <p className="mt-1 text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
              <p className="mt-1 text-2xl font-bold text-gray-900">${orderStats.totalAmount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Total Paid</h4>
              <p className="mt-1 text-2xl font-bold text-green-600">${orderStats.totalPaid}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500">Pending Amount</h4>
              <p className="mt-1 text-2xl font-bold text-red-600">${orderStats.totalPending}</p>
            </div>
          </div>
          
          {/* Recent Orders Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Orders</h4>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerOrders.length > 0 ? (
                    customerOrders.slice(0, 5).map(order => {
                      const orderPayments = customerPayments.filter(p => p.orderId === order.id);
                      const paidAmount = orderPayments.reduce((sum, p) => sum + p.amount, 0);
                      const paymentStatus = paidAmount >= order.totalAmount ? 'Paid' : 
                                        paidAmount > 0 ? 'Partial' : 'Pending';
                      
                      return (
                        <tr key={order.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${order.total}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                         
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-sm text-gray-500">
                        No orders found for this customer
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagementScreen;