const https = require('http')

// const postdata = json.stringify({
//     "_postrequests": {
//         "experiment_name": "expt e78ef34d8d498ad46b2625aa91fe2e03",
//         "comments": "test_component_1",
//         "user_id": 1,
//         "creation_timestamp": "2019-06-14+00:00",
//         "service_id": 1,
//         "sample_batch_id": 1,
//         "crop_id": 3,
//         "ticket_number": "ticket 1cc3f06a97c2e7c17cef224c42daaf5c",
//         "request_status_id": 2,
//         "subservice_id": 1
//     }
// });

// const options = {
//     protocol: 'http:',
//     host: '172.17.60.49',
//     port: 8280,
//     path: '/services/samplemanagerdm/requests',
//     method: 'post',
//     headers: {
//         'content-type': 'application/json',
//         'content-length': postdata.length
//         // 'content-type': 'application/x-www-form-urlencoded',
//         // 'content-length': buffer.bytelength(postdata)
//     }
// }

module.exports = function (callback, jsonBody) {

const postdata = JSON.stringify(jsonBody);

const options = {
    protocol: 'http:',
    host: '172.17.60.49',
    port: 8280,
    path: '/services/samplemanagerdm/requests',
    method: 'post',
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
                // let parsedData = JSON.parse(rawData);
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