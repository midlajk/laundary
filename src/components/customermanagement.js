import React, { useState, useEffect } from 'react';
import {
  ShoppingBagIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PlusCircleIcon,
  UserPlusIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CustomerManagementScreen = () => {

  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      try {
        const savedCustomers = localStorage.getItem('laundryCustomers');
        const savedOrders = localStorage.getItem('laundryOrders');
        
        if (savedCustomers) {
          setCustomers(JSON.parse(savedCustomers));
        } else {
          // Initialize with sample customers if none exist
          const sampleCustomers = [
            {
              id: 1,
              customerCode: 'CUST001',
              name: 'John Doe',
              phone: '+1234567890',
              vehicleNumber: 'ABC123',
              email: 'john.doe@email.com',
              address: '123 Main St, City',
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              customerCode: 'CUST002',
              name: 'Jane Smith',
              phone: '+1987654321',
              vehicleNumber: 'XYZ789',
              email: 'jane.smith@email.com',
              address: '456 Oak Ave, Town',
              createdAt: new Date().toISOString()
            }
          ];
          setCustomers(sampleCustomers);
          localStorage.setItem('laundryCustomers', JSON.stringify(sampleCustomers));
        }

        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        } else {
          // Initialize with sample orders
          const sampleOrders = [
            {
              id: 1,
              customerId: 1,
              status: 'in_progress',
              paymentStatus: 'pending',
              totalAmount: 25.50,
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              customerId: 1,
              status: 'ready',
              paymentStatus: 'pending',
              totalAmount: 15.00,
              createdAt: new Date().toISOString()
            },
            {
              id: 3,
              customerId: 2,
              status: 'completed',
              paymentStatus: 'paid',
              totalAmount: 30.00,
              createdAt: new Date().toISOString()
            }
          ];
          setOrders(sampleOrders);
          localStorage.setItem('laundryOrders', JSON.stringify(sampleOrders));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save customers to localStorage whenever customers change
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('laundryCustomers', JSON.stringify(customers));
    }
  }, [customers]);

  // Calculate customer statistics
  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    const pendingDeliveries = customerOrders.filter(order => 
      order.status === 'in_progress' || order.status === 'ready'
    ).length;
    const pendingPayments = customerOrders
      .filter(order => order.paymentStatus === 'pending')
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    return { pendingDeliveries, pendingPayments };
  };

  // Calculate overall statistics
  const totalCustomers = customers.length;
  const customersWithPendingDeliveries = customers.filter(customer => 
    getCustomerStats(customer.id).pendingDeliveries > 0
  ).length;
  const totalPendingPayments = customers.reduce((sum, customer) => 
    sum + getCustomerStats(customer.id).pendingPayments, 0
  );

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCustomerCode = () => {
    const maxCode = customers.reduce((max, customer) => {
      const num = parseInt(customer.customerCode.replace(/\D/g, '')) || 0;
      return Math.max(max, num);
    }, 0);
    return `CUST${String(maxCode + 1).padStart(3, '0')}`;
  };

  const handleCreateCustomer = (newCustomer) => {
    const customerWithId = {
      ...newCustomer,
      id: Date.now(),
      customerCode: newCustomer.customerCode || generateCustomerCode(),
      createdAt: new Date().toISOString()
    };
    setCustomers([...customers, customerWithId]);
    setShowCreateModal(false);
  };

  const handleDeleteCustomer = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This will also delete all their orders.')) {
      setCustomers(customers.filter(customer => customer.id !== customerId));
      // Also remove customer's orders
      const updatedOrders = orders.filter(order => order.customerId !== customerId);
      setOrders(updatedOrders);
      localStorage.setItem('laundryOrders', JSON.stringify(updatedOrders));
    }
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
          <p className="text-gray-600 mt-1">Manage customers, track deliveries and payments</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
              <p className="text-sm font-medium text-gray-600">Pending Deliveries</p>
              <p className="text-2xl font-bold text-orange-600">{customersWithPendingDeliveries}</p>
              <p className="text-xs text-gray-500">customers affected</p>
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
              <p className="text-2xl font-bold text-red-600">${totalPendingPayments.toFixed(2)}</p>
              <p className="text-xs text-gray-500">total outstanding</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Orders</p>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter(order => order.status !== 'completed').length}
              </p>
              <p className="text-xs text-gray-500">in progress</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ShoppingBagIcon className="h-6 w-6 text-green-600" />
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
            placeholder="Search customers by name, phone, vehicle or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Customers Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Deliveries</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Payments</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const stats = getCustomerStats(customer.id);
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.customerCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.vehicleNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stats.pendingDeliveries > 0 ? (
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-1" />
                            <span className="text-sm font-medium text-orange-600">
                              {stats.pendingDeliveries}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {stats.pendingPayments > 0 ? (
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-sm font-medium text-red-600">
                              ${stats.pendingPayments.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">$0.00</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => alert('View customer details')}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No customers found. {searchTerm && 'Try a different search term.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
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
                suggestedCode={generateCustomerCode()}
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const form = document.getElementById('customer-form');
                  if (form) {
                    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                    form.dispatchEvent(submitEvent);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerForm = ({ onSave, initialData, suggestedCode }) => {
  const [formData, setFormData] = useState(initialData || {
    customerCode: suggestedCode || '',
    name: '',
    phone: '',
    vehicleNumber: '',
    email: '',
    address: ''
  });

  // Add event listener for form submission
  useEffect(() => {
    const form = document.getElementById('customer-form');
    if (form) {
      const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit();
      };
      form.addEventListener('submit', handleFormSubmit);
      return () => form.removeEventListener('submit', handleFormSubmit);
    }
  }, [formData]);

  const handleSubmit = () => {
    // Basic validation
    if (!formData.customerCode || !formData.name || !formData.phone) {
      alert('Please fill in all required fields (Customer Code, Name, Phone)');
      return;
    }

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      alert('Please enter a valid phone number');
      return;
    }

    // Email validation (if provided)
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }
    }

    onSave(formData);
  };

  return (
    <div id="customer-form" className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code*</label>
          <input
            type="text"
            value={formData.customerCode}
            onChange={(e) => setFormData({...formData, customerCode: e.target.value.toUpperCase()})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="CUST001"
            required
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
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="john.doe@email.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main Street, City, State"
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerManagementScreen;