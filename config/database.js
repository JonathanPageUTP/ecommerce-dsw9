require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs   = require('fs');
const path = require('path');

function getSslConfig() {
  // Si estamos en Render o producción, forzamos SSL sin validación estricta de CA
  if (process.env.NODE_ENV === 'production' || process.env.DB_HOST.includes('aivencloud.com')) {
    return {
      ssl: {
        require: true,
        rejectUnauthorized: false // Esto soluciona el error del certificado autofirmado
      }
    };
  }
  
  // Tu lógica original por si acaso tienes el ca.pem localmente
  const certPath = path.join(__dirname, '..', 'ca.pem');
  if (fs.existsSync(certPath)) {
    return { ssl: { ca: fs.readFileSync(certPath) } };
  }
  
  return {};
}
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:           process.env.DB_HOST,
    port:           parseInt(process.env.DB_PORT) || 3306,
    dialect:        'mysql',
    logging:        false,
    dialectOptions: getSslConfig()
  }
);

sequelize.authenticate()
  .then(() => console.log('Conexion a MySQL establecida'))
  .catch(err => console.error('Error conectando:', err.message));

module.exports = sequelize;