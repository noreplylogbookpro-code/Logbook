
// Parse parameters
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get('type') || 'subscription'; // 'subscription' or 'license'
const tokenParam = urlParams.get('token');
if (tokenParam) {
    localStorage.setItem('authToken', tokenParam);
}

const plans = {
    'subscription': {
        name: 'Cloud Premium Backup',
        desc: 'Secure cloud vault API subscription (₹50/month)',
        price: 50.00,
        tax: 9.00,
        total: 59.00,
        lineText: 'Cloud Backup Subscription'
    },
    'license': {
        name: 'Self-Hosted License',
        desc: 'Commercial self-hosted server validation key (₹1,499/year)',
        price: 1499.00,
        tax: 269.82,
        total: 1768.82,
        lineText: 'Self-Hosted License Key'
    }
};

const currentPlan = plans[type] || plans['subscription'];

// Populate summary
document.getElementById('selectedPlanName').innerText = currentPlan.name;
document.getElementById('selectedPlanDesc').innerText = currentPlan.desc;
document.getElementById('planLineText').innerText = currentPlan.lineText;
document.getElementById('planLinePrice').innerText = `₹${currentPlan.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
document.getElementById('planLineTax').innerText = `₹${currentPlan.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
document.getElementById('planLineTotal').innerText = `₹${currentPlan.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
document.getElementById('payBtn').innerText = `Pay ₹${currentPlan.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Get user profile if logged in
(async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            const res = await fetch('/api/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.email) {
                    document.getElementById('customerEmail').value = data.email;
                }
            }
        } catch (e) { }
    }
})();

// Process payment
async function processPayment(e) {
    e.preventDefault();

    // Hide forms, show loader
    document.getElementById('summaryView').style.display = 'none';
    document.getElementById('formView').style.display = 'none';
    document.getElementById('loadingView').style.display = 'block';

    const token = localStorage.getItem('authToken');

    setTimeout(async () => {
        try {
            if (type === 'subscription') {
                // Activate subscription in cloud SaaS database
                const res = await fetch('/api/subscription/activate-mock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!res.ok) throw new Error('Subscription activation failed.');

                // Show success view
                document.getElementById('loadingView').style.display = 'none';
                document.getElementById('successView').style.display = 'block';

                // Show subscription validity
                const subExpiry = new Date();
                subExpiry.setMonth(subExpiry.getMonth() + 1);
                document.getElementById('expiryDateText').innerText = `Valid until ${subExpiry.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
                document.getElementById('expiryInfo').style.display = 'block';
            } else {
                // Self-hosted license key generation
                // We will request the server's admin license generator endpoint
                // Since we are logged in, we call the generation API
                // Note: Self-hosted keys are generated on-demand by the billing portal
                // In our mock billing portal, we can call an admin generation bypass or simulate generation
                const licenseeEmail = document.getElementById('customerEmail').value || 'licensee@logbookplus';

                // Let's generate the license key using a temporary mockup token or calling generate endpoint
                // Since standard users don't have isMasterAuth, we will sign a signed key locally or
                // use a simple key structure for demo purposes if isMasterAuth is required.
                // Wait, we can generate it using the master signing keys on our server if we had master auth,
                // but here we can just create a simulated valid signed key or fetch it from a public mock generator.
                // Let's call the generate API! Wait, if the user doesn't have Master credentials, calling `/api/master/licenses/generate` will return 403.
                // So let's provide a mock key generation endpoint or simulate the license key generation directly in the billing portal's script if we can.
                // Wait! A valid JWT self-hosted license is signed with LICENSE_SECRET.
                // Since we don't have LICENSE_SECRET in browser JS, how can we generate it?
                // Let's add a public (or authenticated) purchase endpoint `/api/license/purchase-mock` that generates a signed key!
                // This is clean and matches secure architecture:
                const purchaseRes = await fetch('/api/license/purchase-mock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ email: licenseeEmail })
                });

                if (!purchaseRes.ok) throw new Error('Failed to generate license key.');
                const purchaseData = await purchaseRes.json();

                document.getElementById('licenseKeyOutput').innerText = purchaseData.licenseKey;
                document.getElementById('licenseContainer').style.display = 'block';

                document.getElementById('successTitle').innerText = 'License Generated!';
                document.getElementById('successDesc').innerText = 'Copy this license key and insert it into your self-hosted environment.';

                document.getElementById('loadingView').style.display = 'none';
                document.getElementById('successView').style.display = 'block';

                // Show license expiry date
                if (purchaseData.expiresAt) {
                    document.getElementById('expiryDateText').innerText = `Valid until ${purchaseData.expiresAt}`;
                    document.getElementById('expiryInfo').style.display = 'block';
                }
            }
        } catch (err) {
            alert("Payment failed: " + err.message);
            document.getElementById('loadingView').style.display = 'none';
            document.getElementById('summaryView').style.display = 'flex';
            document.getElementById('formView').style.display = 'flex';
        }
    }, 2000); // 2 seconds processing animation
}

// Copy license key
function copyLicenseKey() {
    const keyText = document.getElementById('licenseKeyOutput').innerText;
    navigator.clipboard.writeText(keyText).then(() => {
        alert("License key copied to clipboard!");
    });
}

// Finish checkout redirect
function finishCheckout() {
    window.location.href = '/app/dashboard/';
}
