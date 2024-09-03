// models.js
const { Sequelize } = require('sequelize');

// Set up Sequelize to connect to your PostgreSQL database
const sequelize = new Sequelize('LaundryDB', 'LaundryDB_owner', 'Ztc3rSby9Qfj', {
    host: 'ep-tiny-darkness-a5xwx9p5.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: {
            require: true, // This is for Sequelize
            rejectUnauthorized: false // To allow self-signed certificates
        }
    },
    query: {
        raw: true
    }
});

// Define models
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

const Order = sequelize.define('Order', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customerName: Sequelize.STRING,
    orderDate: { 
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW // Automatically set to the current date/time
    },
    deliveryDate: Sequelize.DATE,
    subtotal: Sequelize.FLOAT,
    discount: Sequelize.FLOAT,
    total: Sequelize.FLOAT
});

const OrderProduct = sequelize.define('OrderProduct', {
    quantity: Sequelize.INTEGER
});

// Define relationships
Customer.hasMany(Order, { foreignKey: 'customerId', onDelete: 'CASCADE' });
Order.belongsTo(Customer, { foreignKey: 'customerId' });

Order.belongsToMany(Product, { through: OrderProduct });
Product.belongsToMany(Order, { through: OrderProduct });

module.exports = { sequelize, Customer, Product, Order, OrderProduct };
