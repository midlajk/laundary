// // Expose protected methods that allow the renderer process to use
// // the ipcRenderer without exposing the entire object
// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('electronAPI', {
//     printTextReceipt: (order) => ipcRenderer.invoke('print-text-receipt', order),
//       validateLicense: () => ipcRenderer.send('validate-license'),
//   onLicenseStatus: (callback) => ipcRenderer.on('license-status', callback),
//   submitLicenseKey: (key) => ipcRenderer.send('submit-license-key', key),

//     // Add other APIs you need to expose
// });
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printTextReceipt: (order) => ipcRenderer.invoke('print-text-receipt', order),
    printPaymentReceipt: (receiptData) => ipcRenderer.invoke('print-payment-reciept', receiptData),
  validateLicense: () => ipcRenderer.invoke('validate-license'),
  submitLicenseKey: (key,companydetails) => ipcRenderer.invoke('submit-license-key', key,companydetails),
  onLicenseStatus: (callback) => {
    const subscription = (event, ...args) => callback(...args);
    ipcRenderer.on('license-status', subscription);
    return () => ipcRenderer.off('license-status', subscription);
  },
  checkInternet: () => ipcRenderer.invoke('check-internet'),
  licenseValidated: () => ipcRenderer.send('license-validated'),
    //   getCompanyDetails: () => ipcRenderer.invoke('get-company-details')

});