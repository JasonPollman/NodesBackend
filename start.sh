npm install
npm run compile
cd ../frontend
npm install
SOCKET_HOST_URL=http://ec2-18-188-163-184.us-east-2.compute.amazonaws.com:3000 npm run build
cd ../backend
PORT=3000 DEBUG=node-factory* npm start