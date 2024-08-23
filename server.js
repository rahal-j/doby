const express = require('express');
const app = express();
const port = 3000;
const laundryData = require('./modules/laundryData');
const path = require('path');
const exphbs = require('express-handlebars');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { Sequelize } = require('sequelize');

// Initialize Sequelize for SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './sessions.sqlite'  // This is where your session data will be stored
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up session middleware
app.use(session({
    secret: 'your_secret_key',  // Replace with your own secret key
    store: new SequelizeStore({
        db: sequelize,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1800000 } // Session expiration time (30 minutes)
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
            res.render('orderList', { title: 'Orders', orders: orders });
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
app.post('/order/add', async (req, res) => {
    const { deliveryDate, products, subtotal, discount, total } = req.body;
    const customer = req.session.customer;

    console.log('customer:', customer);

    if (!customer) {
        return res.status(400).render('addOrder', {
            title: 'Create Order',
            error: 'Customer not found. Please search and select a customer first.',
            showCreateCustomerForm: false
        });
    }

    try {
        // Create the order data
        const newOrder = {
            customerId: customer.id,
            customerName: `${customer.firstName} ${customer.lastName}`,
            deliveryDate: deliveryDate,
            subtotal: parseFloat(subtotal),
            discount: parseFloat(discount),
            total: parseFloat(total)
        };

        // Debugging output
        console.log('New Order:', newOrder);
        console.log('Products:', products); // Add this to see the products received

        // Create the order and associate products with it
        const createdOrder = await laundryData.addOrder(newOrder, products);

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

// Sync Sequelize and start the server
sequelize.sync()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error("Failed to sync Sequelize:", err);
    });
