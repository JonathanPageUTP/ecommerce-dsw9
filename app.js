require('dotenv').config();
const express      = require('express');
const path         = require('path');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const ejsLayouts   = require('express-ejs-layouts');
const sequelize    = require('./config/database');

// Importación de Modelos (necesario para la ruta principal y sincronización)
const { Product, Order, OrderItem } = require('./models');

// Importación de rutas
const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');

const app  = express();
const port = process.env.PORT || 3000;

// Configuración del motor de plantillas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); // Usa views/layout.ejs como base
app.use(ejsLayouts);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Configuración de sesión segura
app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 3600000,
    secure: process.env.NODE_ENV === 'production' 
  }
}));

// Middleware para persistencia del carrito en la sesión
app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = { items: [], totalQty: 0, totalPrice: 0 };
  }
  res.locals.cartItemCount = req.session.cart.totalQty || 0;
  next();
});

/**
 * RUTA PRINCIPAL (HOME)
 * Corregida para usar 'featuredProducts' y evitar el ReferenceError
 */
app.get('/', async (req, res) => {
  try {
    // Buscamos los productos en la base de datos de Aiven
    const productsFromDB = await Product.findAll();
    
    // Renderizamos la vista enviando la variable con el nombre exacto que pide EJS
    res.render('index', { 
      featuredProducts: productsFromDB, 
      title: 'Inicio - J. Page Store' 
    }); 
  } catch (error) {
    console.error('Error al cargar la página de inicio:', error);
    res.status(500).send("Error al conectar con la base de datos de Aiven");
  }
});

// Definición de rutas del sistema
app.use('/products', productRoutes);
app.use('/cart',     cartRoutes);
app.use('/checkout', checkoutRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

/**
 * Sincronización con MySQL en Aivencloud
 * Crea las tablas Products, Orders y OrderItems si no existen
 */
sequelize.sync()
  .then(() => {
    console.log('Conexión exitosa a MySQL en Aivencloud');
    app.listen(port, () => {
      console.log(`Servidor corriendo en: http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Error fatal al sincronizar con Aiven:', err.message);
    process.exit(1);
  });