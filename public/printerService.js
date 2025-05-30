

const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

async function getCompanyDetails() {
    const Store = (await import('electron-store')).default;
    const store = new Store();
    return store.get('companyDetails');
}
class PrinterService {
 constructor() {
  try {
    this.printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,       // Must match TM-T series
    interface: '\\\\localhost\\ReceiptPrinter', // Shared name
    options: { timeout: 5000 }     // Extended timeout for USB

    });
    
    this.printer.isPrinterConnected().then((connected) => {
      this.printerAvailable = connected;
      console.log('printer connected',connected)
    }).catch((err) => {
      console.log("Printer check failed:", err);
      this.printerAvailable = false;
    });

  } catch (error) {
    console.log("Printer initialization failed:", error);
    this.printerAvailable = false;
  }
}


  

 
  async printReceipt(order) {
  if (!order || !order.items || !Array.isArray(order.items)) {
    console.log("Invalid order data:", order);
    return false;
  }

  let thermal = false;
  let epos = false;

  // Try node-thermal-printer if available
    try {
      thermal = await this.printWithNodeThermalPrinter(order);
    } catch (error) {
      console.log("Failed with node-thermal-printer:", error);
    }
  

 

  // Return true if any method succeeded
  return thermal 
}


async printWithNodeThermalPrinter(order) {
    const companyDetails = await getCompanyDetails();

    // Initialize printer
    this.printer.clear();
    this.printer.alignCenter();
    
    // Company header
    this.printer.setTextDoubleHeight();
    this.printer.bold(true);
    this.printer.println(companyDetails.name);
    this.printer.setTextNormal();
    this.printer.bold(false);
    this.printer.println(companyDetails.address);
    this.printer.println(`Tel: ${companyDetails.phone}`);
    this.printer.println(`TRN: ${companyDetails.trn}`);
    this.printer.drawLine();
    
    // Order details
    this.printer.alignLeft();
    this.printer.bold(true);
    this.printer.println("LAUNDRY RECEIPT");
    this.printer.bold(false);
    this.printer.println(`Receipt #: ${order.id}`);
    this.printer.println(`Date: ${new Date(order.date).toLocaleString()}`);
    this.printer.println(`Customer: ${order.customerId}`);
    // this.printer.println(`Phone: ${order.customerPhone || 'N/A'}`);
    // this.printer.println(`Pickup Date: ${order.pickupDate}`);
    // this.printer.println(`Delivery Date: ${order.deliveryDate}`);
    this.printer.drawLine();
    
    // Items table
    this.printer.tableCustom([
        { text: "Service", align: "LEFT", width: 0.5, bold: true },
        { text: "Qty", align: "CENTER", width: 0.15, bold: true },
        { text: "Price", align: "CENTER", width: 0.2, bold: true },
        { text: "Total", align: "RIGHT", width: 0.15, bold: true }
    ]);
    
    order.items.forEach(item => {
        const serviceName = item.name.length > 24 ? item.name.substring(0, 21) + '...' : item.name;
        this.printer.tableCustom([
            { text: serviceName, align: "LEFT", width: 0.5 },
            { text: item.quantity.toString(), align: "CENTER", width: 0.15 },
            { text: item.price.toFixed(2), align: "CENTER", width: 0.2 },
            { text: (item.price * item.quantity).toFixed(2), align: "RIGHT", width: 0.15 }
        ]);
        
        // Print special instructions if any
        if (item.instructions) {
            this.printer.tableCustom([
                { text: `- ${item.instructions}`, align: "LEFT", cols: 4 }
            ]);
        }
    });
    
    this.printer.drawLine();
    
    // Totals
    this.printer.alignRight();
    this.printer.println(`Subtotal: ${order.subtotal.toFixed(2)}`);
    if (order.discount > 0) {
        this.printer.println(`Discount: -${order.discount.toFixed(2)}`);
    }
    this.printer.println(`VAT (5%): ${order.vat.toFixed(2)}`);
    this.printer.newLine();
    this.printer.bold(true);
    this.printer.println(`TOTAL: ${order.total.toFixed(2)}`);
    this.printer.bold(false);
    this.printer.drawLine();
    

    // Cut paper (if supported)
    this.printer.cut();
    
    // Execute print
    await this.printer.execute();
    return true;
}

  async printpayment(receiptData) {
  if (!receiptData) {
    console.error("Invalid receipt data:", receiptData);
    return false;
  }
const companyDetails = await getCompanyDetails();

 this.printer.clear();

    // Print company header
    this.printer.alignCenter();
    this.printer.setTextDoubleHeight();
    this.printer.bold(true);
    this.printer.println(companyDetails.name.toUpperCase());
    this.printer.setTextNormal();
    this.printer.bold(false);
    this.printer.println(companyDetails.address);
    this.printer.println(`Tel: ${companyDetails.phone}`);
    this.printer.println(`TRN: ${companyDetails.trn}`);
    this.printer.drawLine();
    this.printer.newLine();

    // Print receipt header
    this.printer.println('PAYMENT RECEIPT');
    this.printer.drawLine();
    this.printer.newLine();

    // Print receipt details
    this.printer.alignLeft();
    this.printer.println(`Receipt #: ${receiptData.id}`);
    this.printer.println(`Date: ${new Date(receiptData.date).toLocaleDateString()}`);
    this.printer.println(`Time: ${new Date(receiptData.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
    this.printer.newLine();

    // Customer information
    if (receiptData.customerName) {
      this.printer.println('CUSTOMER DETAILS');
      this.printer.println(`Name: ${receiptData.customerName}`);
      if (receiptData.customerPhone) {
        this.printer.println(`Phone: ${receiptData.customerPhone}`);
      }
      this.printer.newLine();
    }

    // Payment information
    this.printer.println('PAYMENT DETAILS');
    this.printer.drawLine();
    this.printer.bold(true);
    this.printer.println(`Amount: ${parseFloat(receiptData.amount).toFixed(2)} AED`);
    this.printer.bold(false);
    this.printer.println(`Method: ${receiptData.method.toUpperCase()}`);
    this.printer.newLine();

    // Notes if available
    if (receiptData.note) {
      this.printer.println('NOTES');
      this.printer.println(receiptData.note);
      this.printer.newLine();
    }

    // Footer
    this.printer.drawLine();
    this.printer.alignCenter();
    this.printer.println('Thank you for your payment!');
    this.printer.newLine();
    this.printer.println('This is a computer generated receipt');
    this.printer.println('No signature required');
    this.printer.newLine();
    this.printer.newLine();
    this.printer.newLine();

    // Cut paper (if supported)
    this.printer.cut();

    // Execute print
    await this.printer.execute();
    console.log('Receipt printed successfully');
    return true;

}


}


module.exports = PrinterService;
