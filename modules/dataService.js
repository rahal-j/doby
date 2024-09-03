const { Customer, Product, Order, OrderProduct, sequelize } = require('./models');

module.exports.initialize = function () {
    return sequelize.sync().then(() => {
        console.log('Database synchronized successfully.');
        return Promise.resolve();
    }).catch((error) => {
        console.error('Unable to sync the database:', error);
        return Promise.reject("Unable to sync the database");
    });
};

module.exports.getAllCustomers = function () {
    return Customer.findAll()
        .then(customers => {
            if (customers.length > 0) {
                return Promise.resolve(customers);
            } else {
                return Promise.reject("No customers found");
            }
        })
        .catch(err => {
            console.error('Error fetching customers:', err);
            return Promise.reject("Error fetching customers");
        });
};

module.exports.addCustomer = function(customerData) {
    return Customer.create(customerData)
        .then(customer => {
            return Promise.resolve(customer);
        })
        .catch(error => {
            console.error('Error creating new customer:', error);
            return Promise.reject("Unable to create customer");
        });
};

module.exports.getAllProducts = function () {
    return Product.findAll()
        .then(products => {
            if (products.length > 0) {
                return Promise.resolve(products);
            } else {
                return Promise.reject("No products found");
            }
        })
        .catch(error => {
            console.error('Error fetching products:', error);
            return Promise.reject("Unable to fetch products");
        });
};

module.exports.addProduct = function (productData) {
    return Product.create(productData)
        .then(product => {
            return Promise.resolve(product);
        })
        .catch(error => {
            console.error('Error creating new product:', error);
            return Promise.reject("Unable to create product");
        });
};

module.exports.getAllOrders = function () {
    return Order.findAll()
        .then(orders => {
            if (orders.length > 0) {
                return Promise.resolve(orders);
            } else {
                return Promise.reject("No orders found");
            }
        })
        .catch(error => {
            console.error('Error fetching orders:', error);
            return Promise.reject("Unable to fetch orders");
        });
};

module.exports.addOrder = function (orderData, products) {
    console.log('Saving Order:', orderData);
    console.log('Products to associate:', products);

    return Order.create({
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        deliveryDate: orderData.deliveryDate,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        total: orderData.total
    })
    .then(order => {
        if (!order || !order.id) {
            console.error('Order creation failed, order ID is missing.');
            return Promise.reject("Order creation failed, order ID is missing.");
        }

        console.log('Order created with ID:', order.id);

        if (Array.isArray(products) && products.length > 0) {
            const orderProducts = products.map(product => ({
                OrderId: order.id,
                ProductId: parseInt(product.id, 10),
                quantity: parseInt(product.quantity, 10)
            }));

            return OrderProduct.bulkCreate(orderProducts)
                .then(() => {
                    console.log('Order-product associations created successfully.');
                    return Promise.resolve(order);
                })
                .catch(err => {
                    console.error('Error creating order-product associations:', err);
                    return Promise.reject("Unable to create order-product associations");
                });
        } else {
            console.log('No products associated with this order.');
            return Promise.resolve(order);
        }
    })
    .catch(error => {
        console.error('Error creating new order:', error);
        return Promise.reject("Unable to create order");
    });
};

module.exports.searchCustomer = function (phoneNumber) {
    return Customer.findOne({ where: { phone: phoneNumber } })
        .then(customer => {
            if (customer) {
                return Promise.resolve(customer);
            } else {
                return Promise.reject("Customer not found");
            }
        })
        .catch(error => {
            console.error('Error searching for customer by phone number:', error);
            return Promise.reject("Error searching for customer");
        });
};
