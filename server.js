const {createServer} = require('http');
const task = require('./cronJob');
const app = require('./app');


httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

task.start();

httpServer.listen(PORT, () => {
  console.log('Server is connected on port:'+ PORT);
})