const config = require('./config');
const createApp = require('./app');

const app = createApp();

app.listen(config.port, () => {
  console.log(`${config.appName} server running on port ${config.port}`);
});

