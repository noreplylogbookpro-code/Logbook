// pricing.js

function initiateCheckout(type) {
    alert("Purchases and subscriptions are only available directly inside the Logbook Plus mobile application. Please download and open the app to subscribe or purchase plans.");
}

document.addEventListener('DOMContentLoaded', function () {

    // ----- Pricing Data -----
    const pricingData = {
        free: {
            title: "Free Plan",
            currency: "₹",
            amount: 0,
            originalAmount: null,
            period: "forever",
            features: [
                "2 entries per day",
                "2 photos per entry",
                "2 exports per month (Excel & Word)",
                "Local backup only",
                "Encrypted local backups",
                "No tags / categories",
                "No PDF export"
            ]
        },
        premium: {
            title: "Cloud Premium Backup",
            currency: "₹",
            monthly: { amount: 50, originalAmount: 100 },
            yearly: { amount: 500, originalAmount: 1000 },
            features: [
                "Everything in Free",
                "Unlimited daily entries",
                "Unlimited monthly exports",
                "Unlock PDF export",
                "Up to 10 photos per entry",
                "Unlock all tags categories",
                "Premium Analytics Dashboard",
                "Auto quota management",
                "Priority support"
            ]
        },
        selfHosted: {
            title: "Self-Hosted License",
            currency: "₹",
            monthly: { amount: 199, originalAmount: 399 },
            yearly: { amount: 1499, originalAmount: 2999 },
            features: [
                "Everything in Premium",
                "Run on private server / Pi",
                "Unlimited local users",
                "Cryptographic offline activation",
                "Zero external servers required",
                "Full control over backup size limits"
            ]
        }
    };

    let currentPeriod = 'monthly';

    // ----- Fetch from API (optional) -----
    fetch('/api/pricing')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data) populateFromApi(data);
            renderPricing();
        })
        .catch(function (err) {
            console.error('Failed to load pricing details dynamically:', err);
            renderPricing();
        });

    // ----- Populate from API -----
    function populateFromApi(data) {
        if (!data) return;
        if (data.free) {
            if (data.free.title) pricingData.free.title = data.free.title;
            if (data.free.features) pricingData.free.features = data.free.features;
            if (data.free.currency) pricingData.free.currency = data.free.currency;
        }

        function updatePlanData(key, apiPlan) {
            if (!apiPlan) return;
            if (apiPlan.title) pricingData[key].title = apiPlan.title;
            if (apiPlan.features) pricingData[key].features = apiPlan.features;
            if (apiPlan.currency) pricingData[key].currency = apiPlan.currency;

            var amount = apiPlan.amount || 0;
            var originalAmount = apiPlan.originalAmount || null;
            var period = (apiPlan.period || '').toLowerCase();

            if (period === 'month' || period === 'monthly') {
                pricingData[key].monthly.amount = amount;
                pricingData[key].monthly.originalAmount = originalAmount;
                pricingData[key].yearly.amount = amount * 10;
                pricingData[key].yearly.originalAmount = originalAmount ? originalAmount * 10 : null;
            } else if (period === 'year' || period === 'yearly') {
                pricingData[key].yearly.amount = amount;
                pricingData[key].yearly.originalAmount = originalAmount;
                if (amount === 1499) {
                    pricingData[key].monthly.amount = 199;
                    pricingData[key].monthly.originalAmount = 399;
                } else {
                    pricingData[key].monthly.amount = Math.round(amount / 10);
                    pricingData[key].monthly.originalAmount = originalAmount ? Math.round(originalAmount / 10) : null;
                }
            }
        }

        updatePlanData('premium', data.premium);
        updatePlanData('selfHosted', data.selfHosted);
    }

    // ----- Render Pricing -----
    function renderPricing() {
        // Free card
        updateCardDOM('free', {
            title: pricingData.free.title,
            currency: pricingData.free.currency,
            amount: 0,
            originalAmount: null,
            period: 'forever',
            features: pricingData.free.features
        });

        // Premium
        var pData = currentPeriod === 'monthly' ? pricingData.premium.monthly : pricingData.premium.yearly;
        updateCardDOM('premium', {
            title: pricingData.premium.title,
            currency: pricingData.premium.currency,
            amount: pData.amount,
            originalAmount: pData.originalAmount,
            period: currentPeriod === 'monthly' ? 'month' : 'year',
            features: pricingData.premium.features,
            effectiveMonthly: currentPeriod === 'yearly' ? (pData.amount / 12) : null
        });

        // Self-Hosted
        var sData = currentPeriod === 'monthly' ? pricingData.selfHosted.monthly : pricingData.selfHosted.yearly;
        updateCardDOM('self-hosted', {
            title: pricingData.selfHosted.title,
            currency: pricingData.selfHosted.currency,
            amount: sData.amount,
            originalAmount: sData.originalAmount,
            period: currentPeriod === 'monthly' ? 'month' : 'year',
            features: pricingData.selfHosted.features,
            effectiveMonthly: currentPeriod === 'yearly' ? (sData.amount / 12) : null
        });
    }

    // ----- Update a single card -----
    function updateCardDOM(className, plan) {
        var card = document.querySelector('.pricing-card.' + className);
        if (!card || !plan) return;

        // Title
        var h2 = card.querySelector('h2');
        if (h2 && plan.title) h2.innerText = plan.title;

        // Currency
        var currencySpan = card.querySelector('.currency');
        if (currencySpan) {
            currencySpan.innerText = plan.currency || '₹';
        }

        // Amount
        var amountSpan = card.querySelector('.amount');
        if (amountSpan) {
            amountSpan.innerText = formatNumber(plan.amount);
        }

        // Period
        var periodSpan = card.querySelector('.period');
        if (periodSpan) {
            var displayPeriod = plan.period || '';
            if (displayPeriod) {
                if (displayPeriod.toLowerCase() === 'forever') {
                    displayPeriod = '/ forever';
                } else if (!displayPeriod.startsWith('/')) {
                    displayPeriod = '/ ' + displayPeriod;
                }
            }
            periodSpan.innerText = displayPeriod;
        }

        // Original Amount
        var originalSpan = card.querySelector('.original-amount');
        if (originalSpan) {
            if (plan.originalAmount && plan.originalAmount > plan.amount) {
                originalSpan.innerText = formatNumber(plan.originalAmount);
                originalSpan.style.display = '';
            } else {
                originalSpan.style.display = 'none';
            }
        }

        // Discount Badge
        var badgeSpan = card.querySelector('.discount-badge');
        if (badgeSpan) {
            if (plan.originalAmount && plan.originalAmount > plan.amount) {
                var discountPercent = Math.round(((plan.originalAmount - plan.amount) / plan.originalAmount) * 100);
                badgeSpan.innerText = discountPercent + '% OFF';
                badgeSpan.style.display = '';
            } else {
                badgeSpan.style.display = 'none';
            }
        }

        // Effective Monthly Price
        var effectiveSpan = card.querySelector('.effective-monthly');
        if (effectiveSpan) {
            if (plan.effectiveMonthly && plan.effectiveMonthly > 0) {
                effectiveSpan.innerText = '₹' + plan.effectiveMonthly.toFixed(2) + '/mo effective';
                effectiveSpan.style.display = '';
            } else {
                effectiveSpan.style.display = 'none';
            }
        }

        // Features
        var featuresUl = card.querySelector('.features');
        if (featuresUl && plan.features) {
            featuresUl.innerHTML = '';
            plan.features.forEach(function (f) {
                var li = document.createElement('li');
                var isNegative = f.toLowerCase().startsWith('no ');
                var iconClass = isNegative ? 'fas fa-times-circle' : 'fas fa-check-circle';
                li.innerHTML = '<i class="' + iconClass + '"></i> ' + escapeHtml(f);
                featuresUl.appendChild(li);
            });
        }
    }

    // ----- Helpers -----
    function formatNumber(n) {
        if (n === null || n === undefined) return '';
        return n.toLocaleString();
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            if (m === '"') return '&quot;';
            if (m === "'") return '&#39;';
            return m;
        });
    }

    // ----- Toggle event listeners -----
    var toggleBtns = document.querySelectorAll('.billing-toggle-btn');
    toggleBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            toggleBtns.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentPeriod = btn.getAttribute('data-period');
            renderPricing();
        });
    });

});