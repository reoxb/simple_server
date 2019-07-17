const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const parsedUrl = require('url');
const sg_api_get = require('./sg_api_get');
const sg_api_post = require('./sg_api_post');

const app = express();
app.use(cors());

const port = process.env.PORT || 8080;
const hostname = 'localhost';
// ethernet
// const hostname = '172.17.56.134';
// ethernet sala juntas
// const hostname = '172.17.56.131';
// wireless
// const hostname = '192.168.137.1';
// local 
// const hostname = 'localhost';

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.post('/action_post', (req, res) => {
  // const url = parsedUrl.parse(req.url, true);
  // console.log(req.body)
  // delete req.body.insertButton

  const elbody = { 
    'text#experiment_name': "EXPT e78ef34d8d498ad46b2625aa91fe2e03",
    'text#comments': "It's Working Now!",
    'number#user_id': '1',
    'date#creation_timestamp': "06/16/2019",
    'number#service_id': '1',
    'number#sample_batch_id': '1',
    'number#crop_id': '3',
    'text#ticket_number': "TICKET 1cc3f06a97c2e7c17cef224c42daaf5c",
    'number#request_status_id': '2',
    'number#subservice_id': '1' 
  }

  // const [host, entity] = url.query.entity.split('/');
  const host = 'SampleManagerDM';
  const entity = 'requests';

  const myObject = {};

  // for (const [key, value] of Object.entries(req.body)) {
  for (const [key, value] of Object.entries(elbody)) {
    const [typeData, prop] = key.split('#')

    switch(typeData){
      case 'number': 
      myObject[`${prop.trim()}`] = Number(value);
      break;
      case 'text': 
      myObject[`${prop.trim()}`] = String(value);
      break;
      case 'date':
      const [mes, dia, anio] = value.split('/')
      const date  = [anio, '-', mes, '-', dia].join('');
      myObject[`${prop.trim()}`] = date;
      break;
      default: console.log('default'); break;
    }
  }

  const jsonBody = {
    [`_post${entity}`] : {
      ...myObject
    }
  }

  // const entity = url.query.entity;
  sg_api_post( (data => console.log(data)), jsonBody)
  res.send('Send ok')
});

app.get('/action_get', (req, res) => {
  const url = parsedUrl.parse(req.url, true);
  const entity = url.query.entity;
  sg_api_get( data => res.json(data) )
});

app.listen(port, hostname, () =>
  console.log(`File server running at http://${hostname}:${port}/`)
);
