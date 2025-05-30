import React, { useState, useEffect, useRef } from 'react';
import db from './db';
// import { useReactToPrint } from 'react-to-print';

const PaymentManagementPage = () => {
  // State variables
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(8); // Reduced for touch-friendly display
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [newPayment, setNewPayment] = useState({
    customerId: '',
    amount: '',
    method: 'cash',
    date: new Date().toISOString().split('T')[0],
    note: '',
    paymentId: '',
    name: '',
    phoneNumber: ''
  });
  const [customers, setCustomers] = useState([]);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const receiptRef = useRef();

  // Fetch data on component mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get all payments first
        const allPayments = await db.payments.toArray();
        
        // Convert date strings to Date objects for filtering
        const startDate = new Date(dateFilter.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateFilter.endDate);
        endDate.setHours(23, 59, 59, 999);

        // Filter payments by date range
        let filteredPayments = allPayments.filter(payment => {
          const paymentDate = new Date(payment.date);
          return paymentDate >= startDate && paymentDate <= endDate;
        });
        
        // Apply search filter
        if (searchQuery) {
          console.log(searchQuery)
          const query = searchQuery.toLowerCase();
          filteredPayments = filteredPayments.filter(payment => 
          
            payment.customerId?.toString().includes(query) ||
            payment.paymentId?.toString().toLowerCase().includes(query) ||
            payment.name?.toLowerCase().includes(query) ||
            payment.phoneNumber?.toLowerCase().includes(query)
          );
        }

        // Sort by date (newest first)
        filteredPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Fetch related customers
        const customerIds = [...new Set(filteredPayments.map(p => p.customerId).filter(id => id))];
        const relatedCustomers = customerIds.length > 0 
          ? await db.customers.where('id').anyOf(customerIds).toArray()
          : [];
        
        // Enrich payments with customer data
        const enrichedPayments = filteredPayments.map(payment => {
          const customer = relatedCustomers.find(c => c.id === payment.customerId) || {};
          return {
            ...payment,
            customerName: payment.name || customer?.name || 'Walk-in Customer',
            customerPhone: payment.phoneNumber || customer?.phoneNumber || ''
          };
        });

        setPayments(enrichedPayments);
        setCustomers(relatedCustomers);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, searchQuery]);

  // Fetch all customers for search
  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        const customers = await db.customers.toArray();
        setAllCustomers(customers);
        setFilteredCustomers(customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchAllCustomers();
  }, []);

  // Filter customers based on search query
  useEffect(() => {
    if (customerSearchQuery) {
      const query = customerSearchQuery.toLowerCase();
      const filtered = allCustomers.filter(customer => 
                customer.customerId?.toLowerCase().includes(query) ||

        customer.name?.toLowerCase().includes(query) ||
        customer.phoneNumber?.includes(query) ||
        customer.vehicleNumber?.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(allCustomers);
    }
  }, [customerSearchQuery, allCustomers]);

  // Calculate summary statistics
  const calculateSummary = () => {
    const totals = {
      cash: 0,
      card: 0,
      bank: 0,
      online: 0
    };

    payments.forEach(payment => {
      const amount = parseFloat(payment.amount) || 0;
      if (payment.method === 'cash') totals.cash += amount;
      else if (payment.method === 'card') totals.card += amount;
      else if (payment.method === 'bank') totals.bank += amount;
      else if (payment.method === 'online') totals.online += amount;
    });

    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

    return {
      ...totals,
      grandTotal
    };
  };

  const summary = calculateSummary();

  // Pagination logic
  const indexOfLastPayment = currentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = payments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPages = Math.ceil(payments.length / paymentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPayment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setNewPayment(prev => ({
      ...prev,
      customerId: customer.customerId,
      name: customer.name,
      phoneNumber: customer.phoneNumber
    }));
    setShowCustomerDropdown(false);
    setCustomerSearchQuery(customer.name);
  };

  // Handle payment submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newPayment.amount || isNaN(parseFloat(newPayment.amount))) {
      alert('Please enter a valid payment amount');
      return;
    }

    try {
      // Generate unique payment ID
      const paymentId = `PAY-${Date.now()}`;
      
      // Create payment data with proper date handling
      const paymentData = {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
        date: new Date(newPayment.date + 'T12:00:00').toISOString(), // Add time to avoid timezone issues
        paymentId,
        name: newPayment.name || 'Walk-in Customer',
        phoneNumber: newPayment.phoneNumber || '',
        createdAt: new Date().toISOString()
      };
      
      // Add the new payment to the database
      const id = await db.payments.add(paymentData);
      console.log('Payment added with ID:', id);

      // Prepare receipt data
      setReceiptData({
        id: paymentId,
        amount: newPayment.amount,
        method: newPayment.method,
        date: newPayment.date,
        note: newPayment.note,
        customerName: paymentData.name,
        customerPhone: paymentData.phoneNumber,
        timestamp: new Date().toISOString()
      });

      // Reset form
      setNewPayment({
        customerId: '',
        amount: '',
        method: 'cash',
        date: new Date().toISOString().split('T')[0],
        note: '',
        paymentId: '',
        name: '',
        phoneNumber: ''
      });
      setSelectedCustomer(null);
      setCustomerSearchQuery('');
      setShowAddPaymentModal(false);
      setShowReceipt(true);

      // Force refresh the payments list
      await refreshPaymentsList();
      
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Failed to add payment. Please check console for details.');
    }
  };

  // Helper function to refresh payments list
  const refreshPaymentsList = async () => {
    try {
      setLoading(true);
      
      // Get all payments first
      const allPayments = await db.payments.toArray();
      
      // Convert date strings to Date objects for filtering
      const startDate = new Date(dateFilter.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateFilter.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Filter payments by date range
      let filteredPayments = allPayments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= startDate && paymentDate <= endDate;
      });
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredPayments = filteredPayments.filter(payment => 
      
          payment.customerId?.toString().includes(query) ||
          payment.paymentId?.toString().toLowerCase().includes(query) ||
          payment.name?.toLowerCase().includes(query) ||
          payment.phoneNumber?.toLowerCase().includes(query)
        );
      }

      // Sort by date (newest first)
      filteredPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Fetch related customers
      const customerIds = [...new Set(filteredPayments.map(p => p.customerId).filter(id => id))];
      const relatedCustomers = customerIds.length > 0 
        ? await db.customers.where('id').anyOf(customerIds).toArray()
        : [];
      
      // Enrich payments with customer data
      const enrichedPayments = filteredPayments.map(payment => {
        const customer = relatedCustomers.find(c => c.id === payment.customerId) || {};
        return {
          ...payment,
          customerName: payment.name || customer?.name || 'Walk-in Customer',
          customerPhone: payment.phoneNumber || customer?.phoneNumber || ''
        };
      });

      setPayments(enrichedPayments);
      setCustomers(relatedCustomers);
    } catch (error) {
      console.error('Error refreshing payments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    // const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toDateString();
  };

  // Handle print receipt
  const handlePrintReceipt = async (receiptData) => {
    // Implement print functionality here
 try {
        const success = await window.electronAPI.printPaymentReceipt(receiptData);
        if (success) {
            alert('Receipt printed successfully!');
        } else {
            alert('Failed to print receipt');
        }
    } catch (error) {
        console.error('Printing error:', error);
        alert('Error while printing receipt');
    }
  };

  // Prepare receipt for printing from table
  const prepareReceipt = (payment) => {
    setReceiptData({
      id: payment.paymentId || `PAY-${payment.id}`,
      amount: payment.amount,
      method: payment.method,
      date: payment.date,
      note: payment.note,
      customerName: payment.customerName,
      customerPhone: payment.customerPhone,
      timestamp: new Date().toISOString()
    });
    setShowReceipt(true);
  };

  // Confirm payment deletion
  const confirmDeletePayment = (paymentId) => {
    setDeletingPaymentId(paymentId);
    setShowDeleteConfirmation(true);
  };

  // Delete payment
  const deletePayment = async () => {
    if (!deletingPaymentId) return;
    
    try {
      await db.payments.delete(deletingPaymentId);
      
      // Refresh the payments list
      await refreshPaymentsList();
      
      // Close confirmation
      setShowDeleteConfirmation(false);
      setDeletingPaymentId(null);
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

// ... (previous imports and state declarations)

  return (
    <div className="container mx-auto">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-blue-800 mb-4 md:mb-0">Payment Manager</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddPaymentModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl transition duration-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              New Payment
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => setDateFilter({...dateFilter, startDate: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => setDateFilter({...dateFilter, endDate: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Payments</label>
            <div className="relative">
              <input
                type="text"
                placeholder="ID, name, phone, method..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-3">
            <div className="text-sm text-green-800">Cash</div>
            <div className="text-xl font-bold text-green-700">${summary.cash.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3">
            <div className="text-sm text-blue-800">Card</div>
            <div className="text-xl font-bold text-blue-700">${summary.card.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-3">
            <div className="text-sm text-purple-800">Bank</div>
            <div className="text-xl font-bold text-purple-700">${summary.bank.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-3">
            <div className="text-sm text-yellow-800">Online</div>
            <div className="text-xl font-bold text-yellow-700">${summary.online.toFixed(2)}</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-3">
            <div className="text-sm text-indigo-800">Total</div>
            <div className="text-xl font-bold text-indigo-700">${summary.grandTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payments...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID / Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPayments.length > 0 ? (
                    currentPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-blue-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-blue-800">
                            {payment.paymentId || `PAY-${payment.id}`}
                          </div>
                          <div className="text-sm font-medium">{payment.customerName} - {payment.customerId} </div>
                          {payment.customerPhone && (
                            <div className="text-xs text-gray-500">{payment.customerPhone}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(payment.date)}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${payment.method === 'cash' ? 'bg-green-100 text-green-800' : 
                              payment.method === 'card' ? 'bg-blue-100 text-blue-800' : 
                              payment.method === 'bank' ? 'bg-purple-100 text-purple-800' :
                              'bg-yellow-100 text-yellow-800'}`}>
                            {payment.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => prepareReceipt(payment)}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-2 rounded-lg transition duration-200"
                              title="Print Receipt"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                              </svg>
                            </button>
                            <button
                              onClick={() => confirmDeletePayment(payment.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-800 p-2 rounded-lg transition duration-200"
                              title="Delete Payment"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No payments found for the selected date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {payments.length > paymentsPerPage && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span> •{' '}
                      <span className="font-medium">{payments.length}</span> payments
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium 
                              ${currentPage === pageNumber
                                ? 'z-10 bg-blue-500 text-white border-blue-500'
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
                        className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-blue-800">Record Payment</h3>
                <button
                  onClick={() => setShowAddPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmitPayment}>
                {/* Customer Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, phone, or vehicle"
                      value={customerSearchQuery}
                      onChange={(e) => {
                        setCustomerSearchQuery(e.target.value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-3.5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                    
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-xl border border-gray-200 max-h-60 overflow-auto">
                        {filteredCustomers.map(customer => (
                          <div
                            key={customer.id}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            <div className="font-semibold text-gray-900">{customer.name}</div>
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>{customer.phoneNumber}</span>
                              {customer.vehicleNumber && <span>{customer.vehicleNumber}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedCustomer && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="font-bold text-blue-800">{selectedCustomer.name}</div>
                      <div className="text-sm text-blue-700">
                        {selectedCustomer.phoneNumber && `Phone: ${selectedCustomer.phoneNumber}`}
                        {selectedCustomer.vehicleNumber && ` • Vehicle: ${selectedCustomer.vehicleNumber}`}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Payment Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      name="amount"
                      value={newPayment.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['cash', 'card', 'bank', 'online'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setNewPayment(prev => ({...prev, method}))}
                          className={`py-3 px-4 rounded-xl border-2 text-center font-medium
                            ${newPayment.method === method 
                              ? 'border-blue-500 bg-blue-100 text-blue-800' 
                              : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        >
                          {method.charAt(0).toUpperCase() + method.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newPayment.date}
                      onChange={handleInputChange}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                    <textarea
                      name="note"
                      value={newPayment.note}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
                      placeholder="Payment reference or description"
                    />
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium shadow-md"
                    disabled={!newPayment.amount}
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Receipt Modal */}
      {showReceipt && receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div ref={receiptRef} className="p-4 border-2 border-dashed border-gray-300 rounded-xl">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-blue-800">Payment Receipt</h2>
                  <p className="text-sm text-gray-500">#{receiptData.id}</p>
                </div>
                
                <div className="border-b border-gray-300 pb-3 mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="text-gray-900">{new Date(receiptData.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="text-gray-900">{new Date(receiptData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
                
                {receiptData.customerName && (
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-700 mb-1">Customer</h3>
                    <p className="text-gray-900 font-medium">{receiptData.customerName}</p>
                    {receiptData.customerPhone && <p className="text-gray-700">{receiptData.customerPhone}</p>}
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-700">Amount:</span>
                    <span className="font-bold text-xl text-blue-800">${parseFloat(receiptData.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-700">Method:</span>
                    <span className="font-medium text-gray-900 capitalize">{receiptData.method}</span>
                  </div>
                  {receiptData.note && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700">Note:</span>
                      <p className="text-gray-900">{receiptData.note}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
                  Thank you for your payment!
                </div>
              </div>
              
              <div className="mt-6 flex justify-center space-x-4">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={()=>handlePrintReceipt(receiptData)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium"
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this payment? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirmation(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={deletePayment}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagementPage;
    