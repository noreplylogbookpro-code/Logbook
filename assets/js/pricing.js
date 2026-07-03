// pricing.js
function initiateCheckout(type) {
    alert("Purchases and subscriptions are only available directly inside the Logbook Plus mobile application. Please download and open the app to subscribe or purchase plans.");
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/pricing')
        .then(res => res.json())
        .then(data => {
            if (data.free) updateCard('free', data.free);
            if (data.premium) updateCard('premium', data.premium);
            if (data.selfHosted) updateCard('self-hosted', data.selfHosted);
        })
        .catch(err => console.error('Failed to load pricing details dynamically:', err));

    function updateCard(className, plan) {
        const card = document.querySelector(`.pricing-card.${className}`);
        if (!card || !plan) return;

        // Title
        const h2 = card.querySelector('h2');
        if (h2 && plan.title) h2.innerText = plan.title;

        // Price container – we'll rebuild it completely
        const priceDiv = card.querySelector('.price');
        if (!priceDiv) return;

        // Build the price content (currency, original, amount, period)
        let html = `<div class="price-content">`;
        html += `<span class="currency">${plan.currency || '₹'}</span>`;
        if (plan.originalAmount && plan.originalAmount > plan.amount) {
            html += `<span class="original-amount">${plan.originalAmount.toLocaleString()}</span>`;
        }
        html += `<span class="amount">${plan.amount.toLocaleString()}</span>`;
        let displayPeriod = plan.period || '';
        if (displayPeriod) {
            if (displayPeriod.toLowerCase() === 'forever') {
                displayPeriod = '/ forever';
            } else if (!displayPeriod.startsWith('/')) {
                displayPeriod = '/ ' + displayPeriod;
            }
        }
        html += `<span class="period">${displayPeriod}</span>`;
        html += `</div>`; // close price-content

        // Add discount badge inside price container (if discount exists)
        if (plan.originalAmount && plan.originalAmount > plan.amount) {
            const discountPercent = Math.round(((plan.originalAmount - plan.amount) / plan.originalAmount) * 100);
            html += `<div class="discount-badge ${className}-discount-badge">${discountPercent}% OFF</div>`;
        }

        // Replace the entire price HTML
        priceDiv.innerHTML = html;

        // Features list
        const featuresUl = card.querySelector('.features');
        if (featuresUl && plan.features) {
            featuresUl.innerHTML = '';
            plan.features.forEach(f => {
                const li = document.createElement('li');
                const isNegative = f.toLowerCase().startsWith('no ');
                const iconClass = isNegative ? 'fas fa-times-circle' : 'fas fa-check-circle';
                const style = isNegative ? 'style="color: #ea4335;"' : '';
                li.innerHTML = `<i class="${iconClass}" ${style}></i> ${escapeHtml(f)}`;
                featuresUl.appendChild(li);
            });
        }
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
});