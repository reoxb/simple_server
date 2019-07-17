const http = require('http');

const options = {
  protocol:'http:',  
  host: '172.17.60.49',
  port: 8290,
  path: '/wctest/v0.1/requests?page=0',
  method: 'GET',
  headers: {
    'Accept' : 'application/json'
  }
}

module.exports = function(callback) {
  const request = http.request(options, (response) => {
    const statusCode = response.statusCode; // 200
    
    const contentType = response.headers['content-type']; //application/json
    console.log(`statusCode: ${statusCode}`);

    let error;

    if (statusCode !== 200) {
      error = new Error(`Request Failed.\n` + `Status Code: ${statusCode}`);
    } else if (!/^application\/json/.test(contentType)) {
      error = new Error(`Invalid content-type.\n` + `Expected application/json but received ${contentType}`);
    }

    if (error) { console.log(error.message); response.resume(); return;}

    response.setEncoding('utf8');

    let rawData = '';

    response.on('data', (chunk) => rawData += chunk);

    response.on('end', () => {
      try {
        let parsedData = JSON.parse(rawData);
        callback(parsedData);
      } catch (e) {
        console.log(e.message);
      }
    });
  });

  request.on('error', (e) => {
    console.log(`Got error: ${e.message}`);
  });
}
