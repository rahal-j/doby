const express = require('express');
const app = express();
const port = 3000;
const laundryData = require('./modules/laundryData');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { sequelize } = require('./modules/models');
const nodemailer = require('nodemailer');
const { orderValidationRules, validate } = require('./validators');
const moment = require('moment-timezone');




// Set up your PostgreSQL connection string
const postgresConnectionString = 'postgres://LaundryDB_owner:Ztc3rSby9Qfj@ep-tiny-darkness-a5xwx9p5.us-east-2.aws.neon.tech:5432/LaundryDB?sslmode=require';

// Set up session store
const sessionStore = new pgSession({
    conString: postgresConnectionString, // PostgreSQL connection string
    tableName: 'session', // Default is 'session', change if your table name is different
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'nalinda.rahal@gmail.com', // Your email address
        pass: 'zilw ylbf egsa zzpj'   // Your email password or app-specific password
    }
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware with connect-pg-simple
app.use(session({
    secret: 'your_secret_key',  // Replace with your own secret key
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1800000,  // Session expiration time (30 minutes)
        secure: false,    // Set to true if using HTTPS
        httpOnly: true    // Prevents JavaScript from accessing cookies
    }
}));

app.set('views', path.join(__dirname, 'views')); // Ensure views path is set correctly

app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, 'views/partials'),
    helpers: {
        navLink: function (url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') +
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));

app.set('view engine', '.hbs');
app.use(function (req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});

const sendOrderConfirmationEmail = async (order, customer) => {
    try {
        const mailOptions = {
            from: 'nalinda.rahal@gmail.com', // Sender address
            to: customer.email, // Recipient's email
            subject: 'Order Confirmation', // Subject line
            text: `Dear ${customer.firstName},\n\nYour order has been placed successfully.\n\nOrder Details:\n- Order ID: ${order.id}\n\n- Order Date: ${order.orderDate}\n- Total: $${order.total}\n- Delivery Date: ${order.deliveryDate}\n\nThank you for your business!\n\nBest regards,\nYour Company Name`, // Plain text body
            // You can also include an HTML body if needed
            // html: '<p>Your HTML message here</p>'
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Route to render the "Add Customer" form
app.get('/customer/add', (req, res) => {
    res.render('addCustomer', { title: 'AddCustomer' });
});

// Route to render the "Add Product" form
app.get('/product/add', (req, res) => {
    res.render('addProduct', { title: 'AddProduct' });
});

// Route to render the "Create Order" form
app.get('/order/add', async (req, res) => {
    try {
        // Fetch all products from the database using async/await
        const products = await laundryData.getAllProducts();

        if (!req.query.phoneNumber) {
            // Clear the session if no phone number is provided
            req.session.customer = null;
        }

        // Render the addOrder view, passing in the necessary data
        res.render('addOrder', {
            title: 'Create Order',
            products: products,  // Pass the products to the template
            phoneNumber: req.query.phoneNumber || null,
            customer: req.session.customer || null,
            error: req.session.error || null,
            showCreateCustomerForm: req.session.showCreateCustomerForm || false
        });

        // Clear specific session variables
        req.session.error = null;
        req.session.showCreateCustomerForm = null;

    } catch (error) {
        console.error("Error retrieving products:", error);

        // Render the error message if there's an issue retrieving products
        res.status(500).render('addOrder', {
            title: 'Create Order',
            error: 'Failed to retrieve products'
        });
    }
});

app.post('/orderCustomer/add', (req, res) => {
    laundryData.addCustomer(req.body)
        .then((customer) => {
            // Store the newly added customer in the session
            req.session.customer = customer; 

            // Redirect back to order creation page with the customer's phone number
            res.redirect('/order/add?phoneNumber=' + customer.phone);
        })
        .catch(err => {
            console.error('Error adding customer:', err);
            res.status(500).send('Error adding customer');
        });
});

// Initialize data when the server starts
laundryData.initialize()
    .then(() => {
        console.log("Data initialized successfully.");
    })
    .catch(error => {
        console.error("Failed to initialize data:", error);
        process.exit(1);
    });

// Root route
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});
// Route to get all customers
app.get('/customers', (req, res) => {
    laundryData.getAllCustomers()
        .then((customers) => {
            res.render('customerList', { title: 'Customers', customers: customers });
        })
        .catch((error) => {
            console.error('Error retrieving customers:', error);
            res.status(500).send('Error retrieving customers');
        });
});

// Route to add a customer
app.post('/customer/add', (req, res) => {
    laundryData.addCustomer(req.body)
        .then((customer) => {
            // Optionally, store the newly added customer in the session or proceed with other logic
            req.session.customer = customer; // Storing the newly created customer from the database
            res.redirect('/customers'); // Redirect to a page showing all customers or a confirmation page
        })
        .catch(err => {
            console.error('Error adding customer:', err);
            res.status(500).send('Error adding customer');
        });
});

// Route to get all products
app.get('/products', (req, res) => {
    laundryData.getAllProducts()
        .then((products) => {
            res.render('productList', { title: 'Products', products: products });
        })
        .catch((error) => {
            console.error('Error retrieving products:', error);
            res.status(500).send('Error retrieving products');
        });
});

app.get('/orders', (req, res) => {
    laundryData.getAllOrders()
        .then((orders) => {
            // Format each order's deliveryDate
            const formattedOrders = orders.map(order => ({
                ...order,
                deliveryDate: moment(order.deliveryDate).format('YYYY-MM-DD HH:mm:ss')
            }));

            res.render('orderList', { title: 'Orders', orders: formattedOrders });
        })
        .catch((error) => {
            console.error('Error retrieving orders:', error);
            res.status(500).send('Error retrieving orders');
        });
});



// Route to add a product
app.post('/product/add', (req, res) => {
    laundryData.addProduct(req.body)
        .then(() => {
            res.redirect('/products'); // Redirect to verify the new product was added
        })
        .catch(err => {
            console.error('Error adding product:', err);
            res.status(500).send('Error adding product');
        });
});

// Route to handle adding an order
app.post('/order/add', orderValidationRules(), validate, async (req, res) => {
    const { deliveryDate, products, subtotal, discount, total } = req.body;
    const customer = req.session.customer;

    if (!customer) {
        return res.status(400).render('addOrder', {
            title: 'Create Order',
            error: 'Customer not found. Please search and select a customer first.',
            showCreateCustomerForm: false
        });
    }

    try {
        // Parse the deliveryDate from the client (datetime-local format) and convert to UTC
        const deliveryDateLocal = moment(req.body.deliveryDate); // Local time
        const deliveryDateUTC = deliveryDateLocal.utc().format('YYYY-MM-DD HH:mm:ss'); // Convert to UTC

        // Create the order data with UTC date
        const newOrder = {
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            deliveryDate: deliveryDateUTC, // UTC date for database
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount),
            total: parseFloat(total)
        };

        // Debugging output
        console.log('New Order:', newOrder);
        console.log('Products:', products);

        // Create the order and associate products with it
        const createdOrder = await laundryData.addOrder(newOrder, products);

        // Send the confirmation email
        await sendOrderConfirmationEmail(createdOrder, customer);

        // Clear the customer from the session after order creation
        req.session.customer = null;

        // Redirect to a success page
        res.redirect('/orders');
    } catch (err) {
        console.error('Error adding order:', err);
        res.status(500).render('addOrder', {
            title: 'Create Order',
            error: 'Failed to add order',
            customer: customer
        });
    }
});



// Route to get all orders
app.get('/orders', async (req, res) => {
    try {
        const orders = await laundryData.getAllOrders();  // Await the promise returned by getAllOrders
        res.json(orders);  // Send orders as JSON response
    } catch (error) {
        console.error("Error retrieving orders:", error); // Log the error
        res.status(500).json({ error: 'Failed to retrieve orders' });
    }
});


// Route to search for a customer by phone number
app.get('/customer/search', (req, res) => {
    const phoneNumber = req.query.phoneNumber;

    if (!phoneNumber) {
        req.session.error = 'Phone number is required';
        return res.redirect('/order/add');
    }

    laundryData.searchCustomer(phoneNumber)
        .then(customer => {
            if (customer) {
                req.session.customer = customer; // Update session with new customer details
                req.session.showCreateCustomerForm = false;  // Customer found, don't show form
            } else {
                req.session.customer = null; // Clear existing customer details if no match is found
                req.session.error = 'Customer not found';
                req.session.showCreateCustomerForm = true;  // Customer not found, show form
            }

            res.redirect('/order/add?phoneNumber=' + phoneNumber);
        })
        .catch(error => {
            console.error("Error searching for customer:", error);
            req.session.error = 'Failed to search for customer';
            req.session.customer = null; // Clear existing customer details on error
            req.session.showCreateCustomerForm = true;
            res.redirect('/order/add?phoneNumber=' + phoneNumber);
        });
});

app.get('/customer/delete/:id', (req, res) => {
    const customerId = req.params.id;

    laundryData.deleteCustomer(customerId)
        .then(() => {
            res.redirect('/customers'); // Redirect to the customer list
        })
        .catch(err => {
            console.error('Error deleting customer:', err);
            res.status(500).send('Error deleting customer');
        });
});

app.get('/order/delete/:id', (req, res) => {
    const orderId = req.params.id;

    laundryData.deleteOrder(orderId)
        .then(() => {
            res.redirect('/orders'); // Redirect to the customer list
        })
        .catch(err => {
            console.error('Error deleting order:', err);
            res.status(500).send('Error deleting order');
        });
});

app.get('/product/delete/:id', (req, res) => {
    const productId = req.params.id;

    laundryData.deleteProduct(productId)
        .then(() => {
            res.redirect('/products'); // Redirect to the customer list
        })
        .catch(err => {
            console.error('Error deleting product:', err);
            res.status(500).send('Error deleting product');
        });
});



// Sync Sequelize and start the server
sequelize.sync({ alter: true }) // This will attempt to alter the existing tables to match the models
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to sync Sequelize:", err);
    });
