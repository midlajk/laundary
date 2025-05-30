document.addEventListener('DOMContentLoaded', () => {
    const statusMessage = document.getElementById('statusMessage');
    const progressBar = document.getElementById('progressBar');
    const keyInputContainer = document.getElementById('keyInputContainer');
    
    // Form elements
    const licenseKeyInput = document.getElementById('licenseKey');
    const companyNameInput = document.getElementById('companyName');
    const contactPersonInput = document.getElementById('contactPerson');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const companyAddressInput = document.getElementById('companyAddress');
    const companyTRNInput = document.getElementById('companyTRN');
    const submitKeyBtn = document.getElementById('submitKey');
    const keyError = document.getElementById('keyError');

    // Simulate progress 
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${Math.min(progress, 90)}%`;
        if (progress >= 100) clearInterval(progressInterval);
    }, 300);

    // Start validation process
    async function startValidation() {
        try {
            statusMessage.textContent = "Checking system requirements...";
            
            const hasInternet = await window.electronAPI.checkInternet();
            
            if (!hasInternet) {
                statusMessage.textContent = "Internet connection required for activation";
                progressBar.style.backgroundColor = "#ff4444";
                showLicenseForm();
                return;
            }

            statusMessage.textContent = "Validating license...";
            const result = await window.electronAPI.validateLicense();
            handleLicenseStatus(result);
        } catch (error) {
            console.error('Validation error:', error);
            statusMessage.textContent = "System validation error";
            progressBar.style.backgroundColor = "#ff4444";
            showLicenseForm();
        }
    }

    // Show license form
    function showLicenseForm() {
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        keyInputContainer.classList.remove('hidden');
        statusMessage.textContent = "Business registration required";
    }

    // Handle license status
    function handleLicenseStatus(data) {
        clearInterval(progressInterval);
        progressBar.style.width = '100%';

        if (data.valid) {
            statusMessage.textContent = "License valid - launching application...";
            progressBar.style.backgroundColor = "#4CAF50";
            setTimeout(() => {
                window.electronAPI.licenseValidated();
            }, 1000);
        } else {
            statusMessage.textContent = data.message || "License validation failed";
            progressBar.style.backgroundColor = "#ff4444";

            if (data.requiresKey) {
                showLicenseForm();
            }
        }
    }

    // Setup license status listener
    window.electronAPI.onLicenseStatus(handleLicenseStatus);

    // Submit license key handler
    submitKeyBtn.addEventListener('click', async () => {
        const key = licenseKeyInput.value.trim();
        const company = companyNameInput.value.trim();
        const contact = contactPersonInput.value.trim();
        const phone = phoneNumberInput.value.trim();
        const address = companyAddressInput.value.trim();
        const trn = companyTRNInput.value.trim();
        
        // Validate required fields
        if (!key) {
            showError("Please enter a license key");
            return;
        }
        
        if (!company) {
            showError("Please enter your company name");
            return;
        }
        
        if (!contact) {
            showError("Please enter a contact person");
            return;
        }
        
        if (!phone) {
            showError("Please enter a phone number");
            return;
        }
        
        if (!address) {
            showError("Please enter your business address");
            return;
        }

        keyError.classList.add('hidden');
        statusMessage.textContent = "Registering your business...";
        submitKeyBtn.disabled = true;
        submitKeyBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
        
        try {
            const companyDetails = {
                name: company,
                contactPerson: contact,
                phone: phone,
                address: address,
                trn: trn,
                country: 'UAE',
                registrationDate: new Date().toISOString()
            };
            
            const result = await window.electronAPI.submitLicenseKey(key, companyDetails);
            if (!result.valid) {
                showError(result.message || "Invalid license key");
                submitKeyBtn.disabled = false;
                submitKeyBtn.textContent = "Activate License";
            }
        } catch (error) {
            showError("Error during registration: " + error.message);
            console.error('Registration error:', error);
            submitKeyBtn.disabled = false;
            submitKeyBtn.textContent = "Activate License";
        }
    });

    function showError(message) {
        keyError.textContent = message;
        keyError.classList.remove('hidden');
    }

    // Start the validation process
    startValidation();
});