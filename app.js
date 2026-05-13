require('dotenv').config();
const express      = require('express');
const path         = require('path');
const session      = require('express-session');
const cookieParser = require('cookie-parser');
const ejsLayouts   = require('express-ejs-layouts');
const sequelize    = require('./config/database');

// Importación de rutas
const productRoutes  = require('./routes/products');
const cartRoutes     = require('./routes/cart');
const checkoutRoutes = require('./routes/checkout');

const app  = express();
const port = process.env.PORT || 3000;

// Configuración del motor de plantillas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout'); 
app.use(ejsLayouts);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Configuración de sesión usando el SESSION_SECRET definido previamente
app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-secret',
  resave:            false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 3600000,
    secure: process.env.NODE_ENV === 'production' // Seguridad extra en producción
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

// Ruta principal actualizada con tu información
app.get('/', (req, res) => {
  res.send(`
    <h1>Hello World - Jojonathan. Page</h1>
    <p>La aplicación está funcionando correctamente.</p>
    <p><b>Puerto:</b> ${port} | <b>Entorno:</b> ${process.env.NODE_ENV || 'development'}</p>
    <p>Conectado a la base de datos: <b>${process.env.DB_NAME}</b></p>
  `);
});

// Definición de rutas
app.use('/',         productRoutes); // Descomentado para que veas tus productos
app.use('/cart',     cartRoutes);
app.use('/checkout', checkoutRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Página no encontrada' });
});

// Sincronización con la base de datos de Aiven y arranque del servidor
sequelize.sync()
  .then(() => {
    console.log('Conexión exitosa a MySQL en Aivencloud');
    app.listen(port, () => {
      console.log(`Servidor corriendo en el puerto: ${port}`);
    });
  })
  .catch(err => {
    console.error('Error fatal al sincronizar con Aiven:', err.message);
    process.exit(1);
  });