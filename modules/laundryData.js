// laundryData.js
const { sequelize, Customer, Product, Order, OrderProduct } = require('./models');

// Initialize database
module.exports.initialize = function () {
    return sequelize.sync().then(() => {
        console.log('Database synchronized successfully.');
        return Promise.resolve();
    }).catch((error) => {
        console.error('Unable to sync the database:', error);
        return Promise.reject("unable to sync the database");
    });
};

// Fetch all customers
module.exports.getAllCustomers = function () {
    return new Promise((resolve, reject) => {
        Customer.findAll()
            .then(customers => {
                if (customers.length > 0) {
                    resolve(customers);
                } else {
                    reject("No customers found");
                }
            })
            .catch(err => {
                console.error('Error fetching customers:', err);
                reject("Error fetching customers");
            });
    });
};

// Add a customer
module.exports.addCustomer = function(customerData) {
    return new Promise((resolve, reject) => {
        Customer.create(customerData)
            .then(customer => {
                resolve(customer);
            })
            .catch(error => {
                console.error('Error creating new customer:', error);
                reject("unable to create customer");
            });
    });
};

// Fetch all products
module.exports.getAllProducts = function () {
    return new Promise((resolve, reject) => {
        Product.findAll()
            .then(products => {
                if (products.length > 0) {
                    resolve(products);
                } else {
                    reject("No products found");
                }
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                reject("Unable to fetch products");
            });
    });
};

// Add a product
module.exports.addProduct = function (productData) {
    return new Promise((resolve, reject) => {
        Product.create(productData)
            .then(product => {
                resolve(product);
            })
            .catch(error => {
                console.error('Error creating new product:', error);
                reject("Unable to create product");
            });
    });
};

// Fetch all orders
module.exports.getAllOrders = function () {
    return new Promise((resolve, reject) => {
        Order.findAll()
            .then(orders => {
                if (orders.length > 0) {
                    resolve(orders);
                } else {
                    reject("No orders found");
                }
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                reject("Unable to fetch orders");
            });
    });
};

// Add an order with associated products
module.exports.addOrder = function (orderData, products) {
    return new Promise((resolve, reject) => {
        Order.create({
            customerId: orderData.customerId,
            customerName: orderData.customerName,
            orderDate: orderData.orderDate || new Date(),
            deliveryDate: orderData.deliveryDate,
            subtotal: orderData.subtotal,
            discount: orderData.discount,
            total: orderData.total
        })
        .then(order => {
            if (Array.isArray(products) && products.length > 0) {
                const orderProducts = products.map(product => ({
                    OrderId: order.id,
                    ProductId: parseInt(product.id, 10),
                    quantity: parseInt(product.quantity, 10)
                }));

                return OrderProduct.bulkCreate(orderProducts)
                    .then(() => {
                        resolve(order);
                    })
                    .catch(err => {
                        console.error('Error creating order-product associations:', err);
                        reject("Unable to create order-product associations");
                    });
            } else {
                resolve(order);
            }
        })
        .catch(error => {
            console.error('Error creating new order:', error);
            reject("Unable to create order");
        });
    });
};

// Search for a customer by phone number
module.exports.searchCustomer = function (phoneNumber) {
    return new Promise((resolve, reject) => {
        Customer.findOne({
            where: {
                phone: phoneNumber
            }
        })
        .then(customer => {
            if (customer) {
                resolve(customer);
            } else {
                reject("Customer not found");
            }
        })
        .catch(error => {
            console.error('Error searching for customer by phone number:', error);
            reject("Error searching for customer");
        });
    });
};

// Delete a customer by ID
module.exports.deleteCustomer = function (customerId) {
    return new Promise((resolve, reject) => {
        Customer.destroy({
            where: {
                id: customerId
            }
        })
        .then(deleted => {
            if (deleted) {
                resolve(`Customer with ID ${customerId} deleted successfully.`);
            } else {
                reject("Customer not found");
            }
        })
        .catch(error => {
            console.error('Error deleting customer:', error);
            reject("Unable to delete customer");
        });
    });
};

module.exports.deleteOrder = function (orderId) {
    return new Promise((resolve, reject) => {
        Order.destroy({
            where: {
                id: orderId
            }
        })
        .then(deleted => {
            if (deleted) {
                resolve(`Order with ID ${orderId} deleted successfully.`);
            } else {
                reject("Order not found");
            }
        })
        .catch(error => {
            console.error('Error deleting order:', error);
            reject("Unable to delete order");
        });
    });
};

module.exports.deleteProduct = function (productId) {
    return new Promise((resolve, reject) => {
        Product.destroy({
            where: {
                id: productId
            }
        })
        .then(deleted => {
            if (deleted) {
                resolve(`Product with ID ${productId} deleted successfully.`);
            } else {
                reject("Product not found");
            }
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            reject("Unable to delete product");
        });
    });
};