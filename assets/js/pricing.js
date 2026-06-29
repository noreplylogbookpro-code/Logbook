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

        // Discount badge
        if (plan.originalAmount && plan.amount && plan.originalAmount > plan.amount) {
            const discountPercent = Math.round(((plan.originalAmount - plan.amount) / plan.originalAmount) * 100);
            let badge = card.querySelector('.discount-badge');
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'discount-badge';
                card.insertBefore(badge, card.firstChild);
            }
            badge.textContent = `${discountPercent}% OFF`;
        } else {
            // Remove badge if no discount
            const badge = card.querySelector('.discount-badge');
            if (badge) badge.remove();
        }

        // Price elements
        const priceDiv = card.querySelector('.price');
        if (priceDiv) {
            let html = `<span class="currency">${plan.currency || '₹'}</span>`;
            if (plan.originalAmount) {
                html += `<span class="original-amount" style="text-decoration: line-through; opacity: 0.6; font-size: 1.8rem; margin-right: 8px; font-weight: normal; color: var(--text-muted);">${plan.originalAmount.toLocaleString()}</span>`;
            }
            html += `<span class="amount">${plan.amount.toLocaleString()}</span>`;
            
            let displayPeriod = plan.period;
            if (displayPeriod) {
                if (displayPeriod.toLowerCase() === 'forever') {
                    displayPeriod = '/ forever';
                } else if (!displayPeriod.startsWith('/')) {
                    displayPeriod = '/ ' + displayPeriod;
                }
            } else {
                displayPeriod = '';
            }
            html += `<span class="period">${displayPeriod}</span>`;
            priceDiv.innerHTML = html;
        }

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
