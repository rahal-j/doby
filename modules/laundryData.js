const { Sequelize } = require('sequelize');

// Set up Sequelize to connect to your PostgreSQL database
const sequelize = new Sequelize('LaundryDB', 'LaundryDB_owner', 'Ztc3rSby9Qfj', {
    host: 'ep-tiny-darkness-a5xwx9p5.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { 
            rejectUnauthorized: false 
        }
    },
    query: {
        raw: true
    }
});

module.exports = sequelize;


const Customer = sequelize.define('Customer', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    phone: Sequelize.STRING,
    address: Sequelize.STRING
});

// Define the Product model
const Product = sequelize.define('Product', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    category: Sequelize.STRING,
    subcategory: Sequelize.STRING,
    item: Sequelize.STRING,
    price: Sequelize.FLOAT,
    unit: Sequelize.STRING
});

// Define the Order model
const Order = sequelize.define('Order', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerName: Sequelize.STRING,
    deliveryDate: Sequelize.DATE,
    subtotal: Sequelize.FLOAT,
    discount: Sequelize.FLOAT,
    total: Sequelize.FLOAT
});

// Define the OrderProduct model for many-to-many relationship
const OrderProduct = sequelize.define('OrderProduct', {
    quantity: Sequelize.INTEGER
});

// Define relationships
Customer.hasMany(Order, { foreignKey: 'customerId', onDelete: 'CASCADE' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

Order.belongsToMany(Product, { through: OrderProduct });
Product.belongsToMany(Order, { through: OrderProduct });

module.exports = { Customer, Product, Order, OrderProduct };


module.exports.initialize = function () {
    return sequelize.sync().then(() => {
        console.log('Database synchronized successfully.');
        return Promise.resolve();
    }).catch((error) => {
        console.error('Unable to sync the database:', error);
        return Promise.reject("unable to sync the database");
    });
};

module.exports.getAllCustomers = function () {
    return new Promise((resolve, reject) => {
        Customer.findAll() // Fetch all customers from the database
            .then(customers => {
                if (customers.length > 0) {
                    resolve(customers); // Resolve with the list of customers if found
                } else {
                    reject("No customers found"); // Reject if no customers are found
                }
            })
            .catch(err => {
                console.error('Error fetching customers:', err);
                reject("Error fetching customers"); // Reject in case of any error
            });
    });
};

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

module.exports.getAllProducts = function () {
    return new Promise((resolve, reject) => {
        // Retrieve all products from the PostgreSQL database
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

module.exports.addProduct = function (productData) {
    return new Promise((resolve, reject) => {
        // Create a new product in the PostgreSQL database
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

module.exports.getAllOrders = function () {
    return new Promise((resolve, reject) => {
        Order.findAll() // Fetch all orders without any includes
            .then(orders => {
                if (orders.length > 0) {
                    resolve(orders); // Resolve with the list of orders if found
                } else {
                    reject("No orders found"); // Reject if no orders are found
                }
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
                reject("Unable to fetch orders"); // Reject in case of any error
            });
    });
};







module.exports.addOrder = function (orderData, products) {
    return new Promise((resolve, reject) => {
        console.log('Saving Order:', orderData);
        console.log('Products to associate:', products);

        // Create the order first
        Order.create({
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
                return reject("Order creation failed, order ID is missing.");
            }

            console.log('Order created with ID:', order.id);

            if (Array.isArray(products) && products.length > 0) {
                // Prepare to create OrderProduct records
                const orderProducts = products.map(product => ({
                    OrderId: order.id,
                    ProductId: parseInt(product.id, 10),  // Ensure product ID is an integer
                    quantity: parseInt(product.quantity, 10)  // Ensure quantity is an integer
                }));

                // Insert into OrderProduct table using bulkCreate
                return OrderProduct.bulkCreate(orderProducts)
                    .then(() => {
                        console.log('Order-product associations created successfully.');
                        resolve(order);
                    })
                    .catch(err => {
                        console.error('Error creating order-product associations:', err);
                        reject("Unable to create order-product associations");
                    });
            } else {
                console.log('No products associated with this order.');
                resolve(order);
            }
        })
        .catch(error => {
            console.error('Error creating new order:', error);
            reject("Unable to create order");
        });
    });
};








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
}
