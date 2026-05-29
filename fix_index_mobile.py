with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

mobile_css = """
/* ── INDEX.HTML MOBILE + IPAD IMPROVEMENTS ── */
@media(max-width:600px){
  /* Hero */
  .hero{min-height:92vh;padding:0 16px}
  .hero-title{font-size:clamp(2rem,8vw,3.2rem);letter-spacing:2px}
  .hero-sub{font-size:.75rem;letter-spacing:2px}
  .hero-btns{flex-direction:column;gap:10px;align-items:center}
  .hero-btns a,.hero-btns button{width:80%;text-align:center}

  /* Section headings */
  .sec-head{padding:0 16px;margin-bottom:24px}
  .sec-title{font-size:clamp(1.6rem,6vw,2.4rem)}
  section{padding:40px 0}

  /* Product grid */
  .products-grid{grid-template-columns:1fr 1fr;gap:12px;padding:0 12px}
  .product-card{border-radius:6px}
  .product-img{height:180px}
  .product-name{font-size:.8rem}
  .product-price{font-size:.75rem}

  /* Swatches */
  .swatch{width:20px;height:20px}
  .swatches{gap:5px}

  /* Size buttons */
  .size-btn{padding:5px 8px;font-size:.6rem;min-width:36px;min-height:36px}

  /* Add to cart button */
  .btn-cart{padding:10px 14px;font-size:.65rem;min-height:44px}

  /* Bespoke form */
  .bespoke-form{padding:0 16px}
  .form-grid{grid-template-columns:1fr}
  .form-row{grid-template-columns:1fr}
  .form-group{margin-bottom:12px}
  .form-label{font-size:.65rem}
  .form-input,.form-select,.form-textarea{font-size:.9rem;padding:10px 12px;min-height:44px}

  /* Cart / Quote / Wishlist drawers */
  .drawer{width:100vw;max-width:100vw}
  .drawer-inner{padding:16px}
  .drawer-title{font-size:1.1rem}
  .cart-item{gap:10px}
  .cart-item-img{width:60px;height:70px}

  /* Checkout modal */
  .checkout-modal{width:100vw;max-width:100vw;border-radius:16px 16px 0 0;top:auto;bottom:0}

  /* Currency bar */
  .currency-bar{overflow-x:auto;scrollbar-width:none}
  .currency-btn{padding:6px 10px;font-size:.6rem}

  /* Reviews */
  .reviews-grid{grid-template-columns:1fr}
  .review-card{padding:20px}

  /* Atelier / Find us */
  .atelier-grid{grid-template-columns:1fr}
  .find-grid{grid-template-columns:1fr;gap:20px}

  /* Shipping section */
  .shipping-grid{grid-template-columns:1fr 1fr}

  /* Bottom nav safe area */
  main,#main{padding-bottom:80px}
  .page-footer,.footer{padding-bottom:90px}

  /* Floating WhatsApp */
  .wa-float{bottom:80px;right:16px}

  /* Tabs */
  .tab-btn{padding:10px 14px;font-size:.65rem}
}

@media(min-width:601px) and (max-width:1023px){
  /* iPad */
  .products-grid{grid-template-columns:repeat(2,1fr);gap:18px;padding:0 24px}
  .product-img{height:260px}
  .form-grid{grid-template-columns:1fr 1fr}
  .form-row{grid-template-columns:1fr 1fr}
  .atelier-grid{grid-template-columns:1fr 1fr}
  .reviews-grid{grid-template-columns:1fr 1fr}
  .drawer{width:420px}
  .hero-title{font-size:clamp(2.5rem,5vw,4rem)}
  section{padding:60px 0}
}

@media(min-width:1024px){
  .products-grid{grid-template-columns:repeat(3,1fr)}
}
"""

# Insert before closing </style> tag in the head
content = content.replace('</style>', mobile_css + '\n</style>', 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS - index.html mobile and iPad CSS applied')
