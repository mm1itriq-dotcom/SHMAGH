// Currency Converter Logic

document.addEventListener('DOMContentLoaded', () => {
    // Check if modal exists, if not inject it
    if (!document.getElementById('converter-modal')) {
        const modalHTML = `
        <div id="converter-modal" class="converter-overlay" style="display: none; opacity: 0;">
            <div class="converter-box glass-panel">
                <div class="converter-header">
                    <h2>Currency Converter</h2>
                    <button id="close-converter" class="close-btn"><i class="ph ph-x"></i></button>
                </div>
                
                <div class="converter-body">
                    <div class="currency-input-group">
                        <div class="currency-select">
                            <img src="https://flagcdn.com/w20/us.png" id="from-flag" alt="flag">
                            <select id="from-currency">
                                <option value="USD">USD</option>
                                <option value="JOD">JOD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="SAR">SAR</option>
                                <option value="AED">AED</option>
                            </select>
                        </div>
                        <input type="number" id="from-amount" value="1000" min="0">
                    </div>

                    

                    <div class="currency-input-group">
                        <div class="currency-select">
                            <img src="https://flagcdn.com/w20/jo.png" id="to-flag" alt="flag">
                            <span id="to-currency" style="color: #fff; font-weight: 600; padding-right: 15px; padding-left: 5px;">JOD</span>
                        </div>
                        <input type="text" id="to-amount" value="709.00" readonly class="gold-text">
                    </div>
                    
                    <div class="exchange-rate-info" id="rate-info">
                        1 USD = 0.709 JOD
                    </div>

                    <button id="convert-btn" class="gold-btn-solid full-width">Convert</button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const modal = document.getElementById('converter-modal');
    const closeBtn = document.getElementById('close-converter');
    const convertBtn = document.getElementById('convert-btn');
    
    const fromAmount = document.getElementById('from-amount');
    const toAmount = document.getElementById('to-amount');
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const fromFlag = document.getElementById('from-flag');
    const toFlag = document.getElementById('to-flag');
    const rateInfo = document.getElementById('rate-info');

    // Attach to all nav links that say Converter or have specific ID
    const openLinks = document.querySelectorAll('a');
    openLinks.forEach(link => {
        if (link.innerText.includes('Converter') || link.innerText.includes('محول')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                // Trigger reflow for fade in
                void modal.offsetWidth;
                modal.style.opacity = '1';
                fetchRates();
            });
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.style.display = 'none', 300);
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBtn.click();
        }
    });

    const flags = {
        'USD': 'us',
        'JOD': 'jo',
        'EUR': 'eu',
        'GBP': 'gb',
        'SAR': 'sa',
        'AED': 'ae'
    };

    let rates = {};

    async function fetchRates() {
        const base = fromCurrency.value;
        try {
            const res = await fetch('http://localhost:8000/api/exchange-rates?base=' + base);
            const data = await res.json();
            rates = data.rates;
            calculate();
        } catch (err) {
            console.error("Failed to fetch rates", err);
            if (base === 'USD') rates = { JOD: 0.709, USD: 1 };
            calculate();
        }
    }

    function calculate() {
        const amount = parseFloat(fromAmount.value) || 0;
        const to = 'JOD';
        const rate = rates[to] || 0;
        const converted = (amount * rate).toFixed(2);
        
        toAmount.value = converted;
        
        // Update labels
        rateInfo.innerText = `1 ${fromCurrency.value} = ${rate.toFixed(3)} ${to}`;
    }

    fromCurrency.addEventListener('change', () => {
        fromFlag.src = `https://flagcdn.com/w20/${flags[fromCurrency.value]}.png`;
        fetchRates();
    });

    

    fromAmount.addEventListener('input', calculate);
    convertBtn.addEventListener('click', () => {
        convertBtn.innerText = localStorage.getItem('shmagh_lang') === 'ar' ? 'جاري التحويل...' : 'Converting...';
        setTimeout(() => {
            calculate();
            convertBtn.innerText = localStorage.getItem('shmagh_lang') === 'ar' ? 'تحويل' : 'Convert';
        }, 300);
    });

    
});