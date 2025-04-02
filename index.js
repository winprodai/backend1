const config = require('./src/config');
const createApp = require('./src/app');

const app = createApp();

app.listen(config.port, () => {
  console.log(`${config.appName} server running on port ${config.port}`);
});

