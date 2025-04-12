let step = 1;

function showStep(step, skipPushState = false) {
  $('.wizard-step').removeClass('active'); // Hide all steps
  $('#wizard-step-' + step).addClass('active'); // Show the current step
  if (!skipPushState) {
    history.pushState({ step: step }, '', `#wizard-step-${step}`);
  }
}

$(document).ready(function () {
  // Initialize step based on URL hash or history.state
  const hashStep = parseInt(location.hash.replace('#wizard-step-', ''), 10);
  if (history.state && history.state.step) {
    step = history.state.step;
  } else if (hashStep >= 1 && hashStep <= 3) {
    step = hashStep;
  } else {
    step = 1; // Default to step 1
  }
  showStep(step, true); // Skip pushState during initialization

  // Handle back and forward navigation
  window.addEventListener('popstate', function (event) {
    if (event.state && event.state.step) {
      step = event.state.step;
      showStep(step, true); // Skip pushState to avoid infinite loop
    } else {
      step = 1; // Default to step 1 if no state is available
      showStep(step, true);
    }
  });

  // Set "Bags Theme" as the default selected theme
  $('.theme-option').removeClass('selected');
  $('.theme-apply-button').removeClass('hidden-element');
  $('.theme-selected-icon').addClass('hidden-element');

  const defaultCard = $('.theme-option[data-theme="Bags theme"]');
  defaultCard.addClass('selected');
  defaultCard.find('.theme-apply-button').addClass('hidden-element'); // Hide the Apply button
  defaultCard.find('.theme-selected-icon').removeClass('hidden-element'); // Show the checkmark

  $('.theme-option').on('click', function () {
    $('.theme-option').removeClass('selected');
    $(this).addClass('selected');
  });

  $('.theme-option button').on('click', function (e) {
    e.stopPropagation(); // Prevent triggering the card click event
    const parentCard = $(this).closest('.theme-option');
    $('.theme-option').removeClass('selected');
    $('.theme-option button').text('Apply').removeClass('btn-success').addClass('btn-outline-primary');
    parentCard.addClass('selected');
    $(this).text('✔').removeClass('btn-outline-primary').addClass('btn-success');
  });

  $('.theme-apply-button').on('click', function () {
    // Remove "selected" class and toggle buttons/checkmarks for all cards
    $('.theme-option').removeClass('selected');
    $('.theme-apply-button').removeClass('hidden-element'); // Replaced d-none with hidden-element
    $('.theme-selected-icon').addClass('hidden-element'); // Replaced d-none with hidden-element

    // Add "selected" class and toggle buttons/checkmarks for the clicked card
    const card = $(this).closest('.theme-option');
    card.addClass('selected');
    $(this).addClass('hidden-element'); // Replaced d-none with hidden-element
    card.find('.theme-selected-icon').removeClass('hidden-element'); // Replaced d-none with hidden-element
  });

  $('#previous-button').click(function () {
    if (step > 1) step--;
    showStep(step);
  });

  // Save selected theme to localStorage when "Next" is clicked
  $('#next-button').click(function () {
    const selectedTheme = $('.theme-option.selected').data('theme');
    if (selectedTheme) {
      localStorage.setItem('themeSelected', selectedTheme);
    }
  });
});

// Logic for add_product.html
function initializeAddProductPage() {
  // Restrict direct access to this page
  const themeSelected = localStorage.getItem('themeSelected');
  if (!themeSelected) {
    window.location.href = './index.html'; // Redirect silently
    return;
  }

  // Check if reset flag is set in localStorage
  const resetFlag = localStorage.getItem('resetAddProductPage');
  if (resetFlag === 'true') {
    // Clear form fields and reset localStorage
    $('#product-type').val('');
    $('#product-category').val('');
    $('#product-subcategory').val('');
    localStorage.removeItem('productType');
    localStorage.removeItem('category');
    localStorage.removeItem('subCategory');
    localStorage.removeItem('resetAddProductPage'); // Clear the reset flag
  } else {
    // Populate form fields with saved data
    const savedProductType = localStorage.getItem('productType');
    const savedCategory = localStorage.getItem('category');
    const savedSubCategory = localStorage.getItem('subCategory');

    if (savedProductType) $('#product-type').val(savedProductType);
    if (savedCategory) $('#product-category').val(savedCategory);
    if (savedSubCategory) $('#product-subcategory').val(savedSubCategory);
  }

  // Save data to localStorage on Next button click
  $('#next-button').click(function () {
    const productType = $('#product-type').val().trim();
    const category = $('#product-category').val().trim();
    const subCategory = $('#product-subcategory').val().trim();

    if (productType === '') {
      alert('Please fill in the Product Type before proceeding.');
    } else {
      localStorage.setItem('productType', productType);
      localStorage.setItem('category', category);
      localStorage.setItem('subCategory', subCategory);
      window.location.href = './product_details.html';
    }
  });

  // Navigate back to the previous page
  $('#back-button').click(function () {
    window.location.href = './index.html';
  });
}

// Logic for product_details.html
function initializeProductDetailsPage() {
  // Restrict direct access to this page
  const productType = localStorage.getItem('productType');
  if (!productType) {
    window.location.href = './add_product.html'; // Redirect to the second page
    return;
  }

  // Update Product Title in real-time
  $('#productName').on('input', function () {
    const productName = $(this).val().trim();
    $('#productTitlePreview').text(productName || 'Product Title');
  });

  // Update Product Description in real-time
  $('#productDescription').on('input', function () {
    const productDescription = $(this).val().trim();
    $('#productDescriptionPreview').text(productDescription || 'Product description will appear here...');
  });

  // Automatically update Net Price and Product Details Price when List Price is entered
  $('#listPrice').on('input', function () {
    const listPrice = parseFloat($(this).val().trim()) || 0;
    const discountPercentage = parseFloat($('#discountPercentage').val().trim()) || 0;
    const shippingCharges = parseFloat($('#shippingCharges').val().trim()) || 0;
    const discountedPrice = calculateDiscountedPrice(listPrice, discountPercentage);
    const finalNetPrice = discountedPrice + shippingCharges;
    $('#netPrice').val(finalNetPrice); // Update Net Price
    updateProductDetailsPrice(listPrice, finalNetPrice); // Update product details price
  });

  // Automatically update Net Price when Discount Percentage is entered
  $('#discountPercentage').on('input', function () {
    const listPrice = parseFloat($('#listPrice').val().trim()) || 0;
    const discountPercentage = parseFloat($(this).val().trim()) || 0;
    const shippingCharges = parseFloat($('#shippingCharges').val().trim()) || 0;
    const discountedPrice = calculateDiscountedPrice(listPrice, discountPercentage);
    const finalNetPrice = discountedPrice + shippingCharges;
    $('#netPrice').val(finalNetPrice); // Update Net Price
    updateProductDetailsPrice(listPrice, finalNetPrice); // Update product details price
  });

  // Automatically update Net Price when Shipping Charges are entered
  $('#shippingCharges').on('input', function () {
    const listPrice = parseFloat($('#listPrice').val().trim()) || 0;
    const discountPercentage = parseFloat($('#discountPercentage').val().trim()) || 0;
    const shippingCharges = parseFloat($(this).val().trim()) || 0;
    const discountedPrice = calculateDiscountedPrice(listPrice, discountPercentage);
    const finalNetPrice = discountedPrice + shippingCharges;
    $('#netPrice').val(finalNetPrice); // Update Net Price
    updateProductDetailsPrice(listPrice, finalNetPrice); // Update product details price
  });

  // Automatically update Product Details Price when Net Price is changed
  $('#netPrice').on('input', function () {
    const netPrice = parseFloat($(this).val().trim()) || 0;
    const listPrice = parseFloat($('#listPrice').val().trim()) || 0;
    updateProductDetailsPrice(listPrice, netPrice); // Update product details price
  });

  // Function to calculate discounted price
  function calculateDiscountedPrice(listPrice, discountPercentage) {
    const discountAmount = (listPrice * discountPercentage) / 100;
    return listPrice - discountAmount;
  }

  // Function to update product details price
  function updateProductDetailsPrice(originalPrice, finalPrice) {
    $('#originalPrice').text(`RS ${originalPrice.toFixed(2)}`); // Update original price
    $('#finalPrice').text(`RS ${finalPrice.toFixed(2)}`); // Update final price
  }
  // Update Product Images in real-time
  $('#productImage').on('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $('#productImagePreview').attr('src', e.target.result).show();
        $('#removeImageBtn').show(); // Show the remove button
      };
      reader.readAsDataURL(file);
    } else {
      $('#productImagePreview').attr('src', '').hide(); // Reset image if no file is selected
      $('#removeImageBtn').hide(); // Hide the remove button
    }
  });

  // Remove Product Image
  $('#removeImageBtn').on('click', function () {
    $('#productImagePreview').attr('src', '').hide(); // Reset the image preview
    $('#productImage').val(''); // Clear the file input
    $(this).hide(); // Hide the remove button
  });

  // Handle form submission
  $('#submitBtn').click(function () {
    // Validate required fields
    const productName = $('#productName').val().trim();
    const netPrice = $('#netPrice').val().trim();
    const listPrice = $('#listPrice').val().trim();

    if (!productName || !netPrice || !listPrice) {
      alert('Please fill in all required fields (Product Name, List Price, and Net Price) before submitting.');
      return;
    }

    // Optional fields
    const productDescription = $('#productDescription').val().trim();
    const discountPercentage = $('#discountPercentage').val().trim();
    const gstRate = $('#gstRate').val().trim();
    const shippingCharges = $('#shippingCharges').val().trim();
    const stockLevel = $('#stockLevel').val().trim();

    // Save product details to localStorage (or send to a backend if needed)
    const productDetails = {
      productName,
      productDescription,
      netPrice,
      listPrice,
      discountPercentage: discountPercentage || null,
      gstRate: gstRate || null,
      shippingCharges: shippingCharges || null,
      stockLevel: stockLevel || null,
    };
    localStorage.setItem('productDetails', JSON.stringify(productDetails));

    // Set reset flag for Add Product page
    localStorage.setItem('resetAddProductPage', 'true');

    // Navigate to the next step
    alert('Product details submitted successfully!');
    window.location.href = './index.html';
  });

  // Navigate back to the Add Product page
  $('#backBtn').click(function () {
    window.location.href = './add_product.html';
  });
}

// Initialize the correct page logic based on the current page
$(document).ready(function () {
  if (window.location.pathname.includes('add_product.html')) {
    initializeAddProductPage();
  } else if (window.location.pathname.includes('product_details.html')) {
    initializeProductDetailsPage();
  }
});
