const https = require('http')

module.exports = function (callback, jsonBody) {

const postdata = JSON.stringify(jsonBody);

const options = {
    protocol: 'http:',
    host: '172.17.60.49',
    port: 8280,
    path: '/services/SampleManagerDM/requests',
    method: 'POST',
    headers: {
        'content-type': 'application/json',
        'content-length': postdata.length
    }
}

    const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`)
        console.log(`headers: ${JSON.stringify(res.headers)}`);

        res.setEncoding('utf8');
        let rawData = '';

        res.on('data', (chunk) => rawData += chunk);

        res.on('end', () => {
            try {
                // callback(parsedData);
                callback(rawData);
            } catch (e) {
                console.log(e.message);
            }
        });
    })

    req.on('error', (error) => {
        console.error(error)
    })

    // write data to request body
    req.write(postdata);
    req.end()
}