document.addEventListener('DOMContentLoaded', () => {
    let productIndex = 1;

    function calculateSubtotal() {
        const productSelects = document.querySelectorAll('.product-select');
        const productQuantities = document.querySelectorAll('.product-quantity');
        let subtotal = 0;

        productSelects.forEach((select, index) => {
            const selectedOption = select.options[select.selectedIndex];
            const price = parseFloat(selectedOption.getAttribute('data-price')) || 0;
            const quantity = parseFloat(productQuantities[index].value) || 0;

            subtotal += price * quantity;
        });

        document.getElementById('subtotal').value = subtotal.toFixed(2);
        calculateTotal();  // Calculate total when subtotal changes
    }

    function calculateTotal() {
        const subtotal = parseFloat(document.getElementById('subtotal').value) || 0;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const total = subtotal - discount;
        document.getElementById('total').value = total.toFixed(2);
    }

    document.getElementById('addProductButton').addEventListener('click', () => {
        const productsContainer = document.getElementById('productsContainer');

        // Create a new product group
        const productGroup = document.createElement('div');
        productGroup.className = 'product-group mt-2';

        // Create inner HTML for new product group
        productGroup.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <select class="form-control product-select" name="products[${productIndex}][id]" required>
                        <option value="">Select a product</option>
                        ${document.querySelector('.product-select').innerHTML}
                    </select>
                </div>
                <div class="col-md-3">
                    <input class="form-control product-quantity mt-2" name="products[${productIndex}][quantity]" type="number" required placeholder="Quantity"/>
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger removeProductButton">X</button>
                </div>
            </div>
        `;

        // Append the new product group to the container
        productsContainer.appendChild(productGroup);

        // Attach event listener to the remove button
        productGroup.querySelector('.removeProductButton').addEventListener('click', () => {
            productGroup.remove();
            calculateSubtotal(); // Recalculate subtotal after removal
        });

        // Attach event listeners to the new select and quantity input
        productGroup.querySelector('.product-select').addEventListener('change', calculateSubtotal);
        productGroup.querySelector('.product-quantity').addEventListener('input', calculateSubtotal);

        productIndex++;
    });

    // Attach event listeners to the initial product select and quantity input
    document.querySelectorAll('.product-select').forEach(select => {
        select.addEventListener('change', calculateSubtotal);
    });

    document.querySelectorAll('.product-quantity').forEach(quantityInput => {
        quantityInput.addEventListener('input', calculateSubtotal);
    });

    // Attach event listener to discount input
    document.getElementById('discount').addEventListener('input', calculateTotal);

    // Recalculate subtotal on page load
    calculateSubtotal();
});
