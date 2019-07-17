const https = require('http')

const options = {
    protocol: 'http:',
    host: '172.17.60.49',
    // port: 8290,
    port: 8280,
    // path: '/wctest/v0.1/requests?page=0',
    path: '/services/SampleManagerDM/requests?page=0',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
}

module.exports = function(callback) {
    const req = https.request(options, (res) => {
        console.log(`statusCode: ${res.statusCode}`)
        res.setEncoding("utf8");

        let rawData = '';

        res.on('data', (chunk) => rawData += chunk);
        
        res.on('end', () => {
            try {
                let parsedData = JSON.parse(rawData);
                //aqui ya podemos trabajar con el objeto json
                callback(parsedData);
                //res.json(parsedData);
                //res.end();
            } catch (e) {
                //si no se puede castear a json
                console.log(e.message);
            }
        });
    })

    req.on('error', (error) => {
        console.error(error)
    })

    req.end()
}