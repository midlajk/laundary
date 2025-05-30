
///////////////////////////////////////////////////////////////////////////
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, child, update } = require('firebase/database');
const fs = require('fs');

const PrinterService = require('./printerService');

// Initialize printer service
const printerService = new PrinterService();


const firebaseConfig = {
     apiKey: "AIzaSyCoIlCKuCN_fb2rHeE2RODRX8tGlNJsC5o",
  authDomain: "laundry-7c1cc.firebaseapp.com",
  databaseURL: "https://laundry-7c1cc-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "laundry-7c1cc",
  storageBucket: "laundry-7c1cc.firebasestorage.app",
  messagingSenderId: "635203717067",
  appId: "1:635203717067:web:0343a544c514f3e7a8184e",
  measurementId: "G-D60ZKZDJEP"
  };
const firebaseApp = initializeApp(firebaseConfig);
// const db = getDatabase(firebaseApp);

let splashWindow;
let mainWindow;

function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        frame: false,
        resizable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
  contextIsolation: true,   // ✅ true for security
    preload: path.join(__dirname, 'preload.js')        }
    });

    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.once('ready-to-show', () => {
        splashWindow.show();
    });

    splashWindow.on('closed', () => {
        splashWindow = null;
    });
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')  // Add preload

        }
    });

    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
    mainWindow.once('ready-to-show', () => {
        if (splashWindow) splashWindow.close();
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    createSplashWindow();

    // Set up IPC handlers
    ipcMain.handle('check-internet', async () => {
        try {
            const response = await fetch('https://www.google.com', { 
                method: 'HEAD', 
                mode: 'no-cors' 
            });
            return true;
        } catch (e) {
            return false;
        }
    });

    ipcMain.handle('validate-license', async () => {
        try {
            return await validateLicense();
        } catch (error) {
            console.log(error);
            return {
                valid: false,
                message: "License validation error",
                requiresKey: false
            };
        }
    });
    ipcMain.handle('get-company-details', async () => {
    return await getCompanyDetails();
});
    
    // ipcMain.handle('submit-license-key', async (event, key) => {
    //     try {
    //         const validationResult = await validateLicense(key);
    //         if (validationResult.valid) {
    //             createMainWindow();
    //         }
    //         return validationResult;
    //     } catch (error) {
    //         console.log(error);
    //         return {
    //             valid: false,
    //             message: "Invalid license key",
    //             requiresKey: true
    //         };
    //     }
    // });

    ipcMain.handle('submit-license-key', async (event, key, companyDetails) => {
    try {
        const validationResult = await validateLicense(key, companyDetails);
        if (validationResult.valid) {
            createMainWindow();
        }
        return validationResult;
    } catch (error) {
        console.log(error);
        return {
            valid: false,
            message: "Invalid license key",
            requiresKey: true
        };
    }
});
    
    ipcMain.on('license-validated', () => {
        createMainWindow();
    });

   ipcMain.handle('print-text-receipt', async (event, order) => {
         return await printerService.printReceipt(order);

    });
    ipcMain.handle('print-payment-reciept', async (event, order) => {
         return await printerService.printpayment(receiptData);

    });
});

// Then send this text to printer using electron's printer module
// async function validateLicense(providedKey = null) {
//     const deviceId = getDeviceId();
//     const licenseKey = providedKey || await getStoredLicenseKey(); // await here!

//     console.log('Validating license key:', licenseKey);
//     if (!licenseKey) {
//         return {
//             valid: false,
//             message: "No license key found",
//             requiresKey: true
//         };
//     }

//     try {
//             const db = getDatabase();

//      const licenseRef = ref(db, `licenses/${licenseKey}`);
//     const snapshot = await get(licenseRef);
//     const licenseData = snapshot.val();

//         console.log('License data:', licenseData);

//         if (!licenseData) {
//             return {
//                 valid: false,
//                 message: "Invalid license key",
//                 requiresKey: true
//             };
//         }

//         const currentDate = new Date();
//         const expiryDate = new Date(licenseData.expiryDate);

//         if (currentDate > expiryDate) {
//             return {
//                 valid: false,
//                 message: "License has expired",
//                 requiresKey: true
//             };
//         }

//         if (licenseData.deviceId && licenseData.deviceId !== deviceId) {
//             return {
//                 valid: false,
//                 message: "License is in use on another device",
//                 requiresKey: false
//             };
//         }

//         if (!licenseData.deviceId) {
//             // await licenseRef.update({
//             //     deviceId: deviceId,
//             //     lastActivation: new Date().toISOString()
//             // });
//             await update(licenseRef, {
//                 deviceId: deviceId,
//                 lastActivation: new Date().toISOString()
//             });

//         }

//         if (providedKey) {
//             storeLicenseKey(providedKey);
//         }

//         return {
//             valid: true
//         };
//     } catch (error) {
//         console.error('License validation error:', error);
//         return {
//             valid: false,
//             message: "License validation error",
//             requiresKey: false
//         };
//     }
// }
async function validateLicense(providedKey = null, companyDetails = null) {
    const deviceId = getDeviceId();
    const licenseKey = providedKey || await getStoredLicenseKey();

    console.log('Validating license key:', licenseKey);
    if (!licenseKey) {
        return {
            valid: false,
            message: "No license key found",
            requiresKey: true
        };
    }

    try {
        const db = getDatabase();
        const licenseRef = ref(db, `licenses/${licenseKey}`);
        const snapshot = await get(licenseRef);
        const licenseData = snapshot.val();

        if (!licenseData) {
            return {
                valid: false,
                message: "Invalid license key",
                requiresKey: true
            };
        }

        const currentDate = new Date();
        const expiryDate = new Date(licenseData.expiryDate);

        if (currentDate > expiryDate) {
            return {
                valid: false,
                message: "License has expired",
                requiresKey: true
            };
        }

        if (licenseData.deviceId && licenseData.deviceId !== deviceId) {
            return {
                valid: false,
                message: "License is in use on another device",
                requiresKey: false
            };
        }

        if (!licenseData.deviceId) {
            await update(licenseRef, {
                deviceId: deviceId,
                lastActivation: new Date().toISOString()
            });
        }

        if (providedKey) {
            storeLicenseKey(providedKey);
            if (companyDetails) {
                storeCompanyDetails(companyDetails);
            }
        }

        return {
            valid: true
        };
    } catch (error) {
        console.error('License validation error:', error);
        return {
            valid: false,
            message: "License validation error",
            requiresKey: false
        };
    }
}

function getDeviceId() {
    // Implement a way to generate a unique device ID
    // This could be based on MAC address, machine ID, etc.
    // For simplicity, we'll use a combination of machine properties
    const { machineIdSync } = require('node-machine-id');
    try {
        return machineIdSync();
    } catch (e) {
        // Fallback if machineId fails
        return require('crypto').randomBytes(16).toString('hex');
    }
}

async function getStoredLicenseKey() {
    const Store = (await import('electron-store')).default;
    const store = new Store();
    return store.get('licenseKey');
}
async function storeLicenseKey(key) {
    const Store = (await import('electron-store')).default;
    const store = new Store();
    store.set('licenseKey', key);
}
async function storeCompanyDetails(companyDetails) {
    const Store = (await import('electron-store')).default;
    const store = new Store();
    store.set('companyDetails', companyDetails);
}

