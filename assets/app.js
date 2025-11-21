// Analytics Training Demo - JavaScript
// This file contains event handlers and interactions for the demo site

// --- Product Data Source (Simulated Backend DB) ---
const productData = {
    'prod_001': {
        icon: '📊',
        name: 'GA4 Fundamentals Course',
        category: 'Courses',
        price: 99.00,
        description: 'Master the basics of Google Analytics 4 with comprehensive hands-on exercises and real-world scenarios.',
        details: [
            { label: 'Duration', value: '6 hours of video content' },
            { label: 'Level', value: 'Beginner to Intermediate' },
            { label: 'Certificate', value: 'Yes' },
            { label: 'Access', value: 'Lifetime' }
        ],
        related: ['prod_002', 'prod_004']
    },
    'prod_002': {
        icon: '📘',
        name: 'GTM Implementation Guide',
        category: 'Guides',
        price: 49.00,
        description: 'Step-by-step guide to Google Tag Manager setup and configuration, focusing on best practices and debugging.',
        details: [
            { label: 'Format', value: 'PDF Ebook' },
            { label: 'Pages', value: '150+' },
            { label: 'Includes', value: 'Checklists and Templates' }
        ],
        related: ['prod_001', 'prod_005']
    },
    'prod_003': {
        icon: '🛒',
        name: 'E-commerce Tracking Template',
        category: 'Templates',
        price: 79.00,
        description: 'Pre-configured GTM container with all standard GA4 e-commerce tags and variables ready to import.',
        details: [
            { label: 'Format', value: 'JSON Container File' },
            { label: 'Events', value: '15+ Pre-configured Events' },
            { label: 'Support', value: 'Setup Guide Included' }
        ],
        related: ['prod_006', 'prod_001']
    },
    'prod_004': {
        icon: '🎯',
        name: 'Advanced Event Tracking Workshop',
        category: 'Courses',
        price: 149.00,
        description: 'Deep dive into custom events, parameters, and user properties for complex tracking needs.',
        details: [
            { label: 'Duration', value: '10 hours' },
            { label: 'Level', value: 'Intermediate to Advanced' },
            { label: 'Focus', value: 'Data Layer Scripting' }
        ],
        related: ['prod_005', 'prod_006']
    },
    'prod_005': {
        icon: '🔧',
        name: 'Data Layer Debugging Toolkit',
        category: 'Tools',
        price: 29.00,
        description: 'A set of scripts and browser extensions to diagnose GTM and data layer issues quickly and efficiently.',
        details: [
            { label: 'Format', value: 'Tool Bundle' },
            { label: 'License', value: 'Perpetual' },
            { label: 'Updates', value: '1 Year Free Updates' }
        ],
        related: ['prod_002', 'prod_004']
    },
    'prod_006': {
        icon: '📦',
        name: 'Complete Analytics Bundle',
        category: 'Bundles',
        price: 299.00,
        description: 'All courses, guides, and templates in one comprehensive package for total analytics mastery.',
        details: [
            { label: 'Value', value: 'Best Value (30% Savings)' },
            { label: 'Includes', value: 'All 5 Products' }
        ],
        related: ['prod_001', 'prod_003']
    }
};

// --- Global Cart State (Simulated Persistent Cart) ---
let cart = []; 

// --- Helper Functions ---
function updateCartIconCount() {
    const countElement = document.getElementById('nav-cart-count');
    if (countElement) {
        const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
        countElement.textContent = itemCount;
        countElement.style.display = itemCount > 0 ? 'block' : 'none';
    }
}

function saveCart() {
    sessionStorage.setItem('trainingCart', JSON.stringify(cart));
    updateCartIconCount(); // NEW: Update cart count on save
    if (window.location.pathname.endsWith('checkout.html')) {
        updateCheckoutSummary();
    }
}

function showCartNotification() {
    const notification = document.getElementById('cart-notification');
    if (notification) {
        notification.classList.remove('hidden');
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
}

function getButtonLocation(element) {
    const section = element.closest('section, header, main');
    if (section) {
        return section.className || section.tagName.toLowerCase();
    }
    return 'unknown';
}

function getCartSubtotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// ===== CORE INITIALIZATION AND DELEGATED LISTENERS =====

document.addEventListener('DOMContentLoaded', function() {
    // Attempt to load cart from session storage on load
    try {
        const storedCart = sessionStorage.getItem('trainingCart');
        if (storedCart) {
            cart = JSON.parse(storedCart);
        }
    } catch (error) {
        console.error("Could not load cart from storage:", error);
    }
    updateCartIconCount(); // Initial count update

    // --- Page Specific Initialization ---
    // Check if we are on the product detail page and load data
    if (document.getElementById('product-detail')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        loadProductDetail(productId || 'prod_001');
    }
    
    // Check if we are on the checkout page and initialize checkout logic
    if (window.location.pathname.endsWith('checkout.html') && cart.length > 0) {
        initializeCheckoutLogic();
    } else if (window.location.pathname.endsWith('checkout.html')) {
        console.warn('Cart is empty on checkout page. Redirecting to shop.');
        // This redirect needs to be outside the event loop if possible
        // window.location.href = 'shop.html'; 
        // return;
    }
    
    // Log page info
    console.log('Page loaded:', {
        page_path: window.location.pathname,
        page_title: document.title,
        page_location: window.location.href
    });
});

// ===== CART FUNCTIONALITY (DELEGATED LISTENER - FIX) =====
document.body.addEventListener('click', function(e) {
    const target = e.target;

    // Delegate handling to find the closest element with the selector
    const addToCartButton = target.closest('.add-to-cart');

    // 1. ADD TO CART BUTTONS
    if (addToCartButton) {
        e.preventDefault(); // Prevent default button action if it's a button, though typically the listener handles navigation

        const productCard = addToCartButton.closest('.product-card') || addToCartButton.closest('.product-detail');
        
        // This logic ensures it works for both product grid and product detail page
        const productId = productCard?.dataset.productId || addToCartButton.dataset.productId;
        const productName = productCard?.dataset.productName || document.getElementById('product-title')?.textContent;
        const productPrice = productCard?.dataset.productPrice || document.getElementById('product-price')?.textContent.replace('$', '');
        const productCategory = productCard?.dataset.productCategory || document.getElementById('product-category')?.textContent;
        
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput?.value || 1);

        // Safety check
        if (!productId || !productPrice) {
             console.error("Missing Product ID or Price for Add To Cart.");
             return;
        }

        // Add or update cart item
        let existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: parseFloat(productPrice),
                category: productCategory,
                quantity: quantity
            });
        }
        
        saveCart();
        showCartNotification();
        
        console.log('Product added to cart:', {
            item_id: productId,
            item_name: productName,
            price: productPrice,
            item_category: productCategory,
            quantity: quantity
        });

        // STUDENTS: This is where you'd push add_to_cart event to dataLayer
    }

    // 2. OUTBOUND LINK TRACKING
    if (target.classList.contains('external-link') || target.matches('a[target="_blank"]')) {
        const url = target.href;
        const linkText = target.textContent;
        
        console.log('Outbound link clicked:', {
            link_url: url,
            link_text: linkText
        });
        // STUDENTS: Fire outbound_click event here
    }

    // 3. FILE DOWNLOAD TRACKING
    if (target.classList.contains('download-link')) {
        const fileName = target.dataset.fileName || target.href.split('/').pop();
        const fileExtension = fileName.split('.').pop();
        
        console.log('File download:', {
            file_name: fileName,
            file_extension: fileExtension,
            link_url: target.href
        });
        // STUDENTS: Fire file_download event here
    }
    
    // 4. CTA BUTTON / CARD TRACKING
    const ctaElement = target.closest('[id*="cta"], .card');
    if (ctaElement) {
        const buttonId = ctaElement.id;
        const cardType = ctaElement.dataset.cardType; 
        const buttonText = ctaElement.textContent.trim().split('\n')[0]; 
        const buttonLocation = getButtonLocation(ctaElement);
        const eventName = cardType ? 'card_click' : 'cta_click';
        
        console.log(`${eventName} fired:`, {
            button_id: buttonId || 'N/A',
            card_type: cardType || 'N/A',
            button_text: buttonText,
            button_location: buttonLocation
        });
        // STUDENTS: Fire the custom event here
    }
});

// ===== FORM HANDLERS (DIRECTLY ATTACHED) =====

// Buy Now button (Product Page - Direct Attachment for clarity)
const buyNowButton = document.getElementById('buy-now');
if (buyNowButton) {
    buyNowButton.addEventListener('click', function(e) {
        const productDetailElement = document.getElementById('product-detail');
        const productId = productDetailElement?.dataset.productId;
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput?.value || 1);
        
        // Clear cart and add only this item for a direct checkout flow simulation
        cart = [];
        const product = productData[productId];
        if (product) {
             cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                category: product.category,
                quantity: quantity
            });
            saveCart();
        }
        console.log('Buy Now clicked. Firing begin_checkout and redirecting to checkout.html');
        // STUDENTS: Fire begin_checkout event here
        window.location.href = 'checkout.html';
    });
}

// Newsletter form (Direct Attachment)
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('newsletter-email').value;
        console.log('Newsletter signup:', { email: email });
        // STUDENTS: Fire newsletter_signup event here
        console.log('SUCCESS: Thank you for subscribing! (Simulated Alert)');
        newsletterForm.reset();
    });
}

// Contact form (Direct Attachment)
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            newsletter: document.getElementById('newsletter-opt-in').checked
        };
        console.log('Contact form submitted:', formData);
        // STUDENTS: Fire contact_form_submit event here
        console.log('SUCCESS: Thank you! Your message has been sent.');
        window.location.href = 'thankyou.html?type=contact';
    });
}

// Scenario Completion Buttons (Direct Attachment)
const scenarioButtons = document.querySelectorAll('[data-scenario]');
scenarioButtons.forEach(button => {
    button.addEventListener('click', function() {
        const scenario = this.dataset.scenario;
        console.log('Scenario completed:', { scenario: scenario });
        // STUDENTS: Fire custom event here
        this.textContent = '✓ Completed';
        this.disabled = true;
        this.style.backgroundColor = '#27ae60';
    });
});


// ===== DYNAMIC PRODUCT LOADING FUNCTION =====

function loadProductDetail(productId) {
    const product = productData[productId];
    const detailContainer = document.getElementById('product-detail');
    
    if (!product || !detailContainer) {
        console.error('Product not found or detail container missing.');
        detailContainer.innerHTML = '<h1>Error: Product ID not valid.</h1>';
        return;
    }

    // 1. Update main fields
    document.getElementById('product-title').textContent = product.name;
    document.getElementById('product-category').textContent = product.category;
    document.getElementById('product-price').textContent = '$' + product.price.toFixed(2);
    document.getElementById('product-description').textContent = product.description;
    document.querySelector('.product-icon').textContent = product.icon;
    
    // Update data- attributes for event listeners to pick up the correct values
    detailContainer.dataset.productId = productId;
    detailContainer.dataset.productName = product.name;
    detailContainer.dataset.productPrice = product.price.toFixed(2);
    detailContainer.dataset.productCategory = product.category;

    // 2. Update list details
    const detailsList = document.querySelector('.product-description-full ul');
    if (detailsList) {
        detailsList.innerHTML = product.details.map(d => `<li><strong>${d.label}:</strong> ${d.value}</li>`).join('');
    }
    
    console.log('Product viewed:', {
        event: 'view_item',
        ecommerce: {
            items: [{
                item_id: productId,
                item_name: product.name,
                price: product.price.toFixed(2),
                item_category: product.category,
            }]
        }
    });
}

// ===== CHECKOUT LOGIC (Encapsulated) =====

function initializeCheckoutLogic() {
    let shippingCost = 0.00;
    let discount = 0.00;
    const taxRate = 0.05; 

    function calculateTotals() {
        const subtotal = getCartSubtotal();
        const taxableSubtotal = subtotal - discount;
        const tax = taxableSubtotal > 0 ? taxableSubtotal * taxRate : 0;
        const total = subtotal + shippingCost + tax - discount; 

        return { subtotal, shippingCost, tax, total, discount };
    }

    window.updateCheckoutSummary = function() { // Made global for cart persistence update
        const { subtotal, shippingCost, tax, total, discount } = calculateTotals();
        
        const cartItemsContainer = document.getElementById('cart-items');
        cartItemsContainer.innerHTML = cart.map(item => `
                <div class="summary-item">
                    <p>${item.quantity}x ${item.name} <span style="float: right;">$${(item.price * item.quantity).toFixed(2)}</span></p>
                </div>
            `).join('')
        + (discount > 0 ? `<div class="summary-item" style="color: var(--danger);">
            <p>Discount: <span style="float: right;">-$${discount.toFixed(2)}</span></p>
        </div>` : '');

        document.getElementById('summary-subtotal').textContent = '$' + subtotal.toFixed(2);
        document.getElementById('summary-shipping').textContent = shippingCost > 0 ? '$' + shippingCost.toFixed(2) : 'Free';
        document.getElementById('summary-tax').textContent = '$' + tax.toFixed(2);
        document.getElementById('summary-total').textContent = '$' + total.toFixed(2);
    }

    updateCheckoutSummary(); 

    document.getElementById('shipping-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const method = document.getElementById('shipping-method').value;
        shippingCost = (method === 'Express') ? 10.00 : 0.00;
        updateCheckoutSummary();

        console.log('Shipping Info Added:', {
            shipping_tier: method,
            shipping_cost: shippingCost.toFixed(2)
        });
        // STUDENTS: Fire add_shipping_info event here
        document.getElementById('shipping-step').classList.add('hidden');
        document.getElementById('payment-step').classList.remove('hidden');
    });
    
    document.getElementById('back-to-shipping')?.addEventListener('click', function() {
        document.getElementById('payment-step').classList.add('hidden');
        document.getElementById('shipping-step').classList.remove('hidden');
    });

    document.getElementById('payment-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const paymentMethod = document.getElementById('payment-method').value;
        const promoCode = document.getElementById('promo-code').value.trim();
        discount = 0.00;
        if (promoCode.toUpperCase() === 'ANALYTICS20') {
            discount = getCartSubtotal() * 0.20; 
            console.log(`Promo Code applied! Discount: $${discount.toFixed(2)}`);
        } 

        const { total, shippingCost, tax } = calculateTotals();
        
        console.log('Payment Info Added:', {
            payment_type: paymentMethod,
            discount_amount: discount.toFixed(2)
        });
        // STUDENTS: Fire add_payment_info event here
        
        const transactionId = 'TRN-' + Date.now();
        console.log('PURCHASE SUCCESS! Firing purchase event and redirecting.');
        console.log({
            event: 'purchase',
            transaction_id: transactionId,
            value: total.toFixed(2),
            shipping: shippingCost.toFixed(2),
            tax: tax.toFixed(2),
            coupon: promoCode || undefined,
            items: cart
        });
        // STUDENTS: FIRE THE FINAL PURCHASE EVENT HERE
        
        cart = [];
        sessionStorage.removeItem('trainingCart'); 
        window.location.href = `thankyou.html?order=${transactionId}&total=${total.toFixed(2)}&type=purchase`;
    });
}


// ===== SCROLL DEPTH TRACKING (ADVANCED) =====
let scrollDepths = [25, 50, 75, 90]; 
let firedDepths = [];

window.addEventListener('scroll', function() {
    const scrollPercent = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
    
    scrollDepths.forEach(depth => {
        if (scrollPercent >= depth && !firedDepths.includes(depth)) {
            firedDepths.push(depth);
            console.log('Scroll depth reached:', { depth: depth + '%' });
            // STUDENTS: Fire scroll_depth event here
        }
    });
});

// ===== ERROR TRACKING (ADVANCED) =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', {
        message: e.message,
        filename: e.filename,
        line: e.lineno,
        column: e.colno
    });
    // STUDENTS: Fire error tracking event here (optional)
});