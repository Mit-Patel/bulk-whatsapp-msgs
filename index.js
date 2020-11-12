// import libraries
var express = require('express');
var bodyParser = require('body-parser')
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const _ = require('lodash');
const cors = require('cors');
const open = require('open');

// node configs
var app = express();
const router = express.Router();

// enable files upload
app.use(fileUpload({
    createParentPath: true
}));

//add other middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));

//set the template engine    
app.set('view engine', 'ejs');


// whatsapp-web lib
const { Client, MessageMedia } = require('whatsapp-web.js');
const QRCode = require('qrcode');

// initializing Whatsapp client and setting listeners
var client = new Client({
    qrRefreshIntervalMs: 300000,
    qrTimeoutMs: 300000,
    takeoverTimeoutMs: 500000,
    puppeteer: {
        args: ['--no-sandbox'],
    }
});
var qrCodeText = '';
var data = [];
var formMessage = '';
var isSent = false;
var statusReady = false;
var csvData = [];

// Whatsapp Web Client events
client.on('qr', qr => {
    qrCodeText = qr;
    console.log("QR: ", qr);
});

client.on('ready', () => {
    try {
        console.log('Client is ready!');

        fs.readFile('uploads/' + data[0], 'utf8', function(err, datas) {
            var dataArray = datas.split(/\r?\n/);

            for (var i = 0; i < dataArray.length; i++) {
                setTimeout((i) => {
                    try {
                        if (i === dataArray.length - 1) {
                            isSent = true;
                        } else {
                            const element = dataArray[i];

                            client.sendMessage(element.toString(), formMessage);
                            client.sendMessage(element.toString(), MessageMedia.fromFilePath("uploads/" + data[1]));

                            console.log("Msg Sent to " + element);

                            csvData.push({ mobno: element.toString(), status: "Sent" });
                            // sentNum++;
                        }
                    } catch (err) {
                        csvData.push({ mobno: dataArray[i].toString(), status: "Not Sent" });
                        console.log("Error while sending message: " + err);
                    }
                }, 2000 * i, i);
            }
        });
        // client.destroy();
    } catch (err) {
        console.log("Error in Client.on(ready): " + err);
    }
});

// API endpoints
router.get('/', function(req, res) {
    client.initialize();
    res.render('index', { status: true, data: '' });
})

router.get('/status', function(req, res) {
    if (statusReady) {
        res.download('uploads/status.csv');
    } else {
        res.send('wait');
    }

    // res.render('index', { data: 'Success' });
})

router.get('/uploads/status.csv', function(req, res) {
    res.download('uploads/status.csv');
})

router.post('/up', async(req, res) => {

    try {
        if (!req.files) {
            res.render('index', {
                status: false,
                data: 'No file uploaded'
            });
        } else {
            if (Object.keys(req.files).length !== 2) {
                res.render('index', {
                    status: false,
                    data: 'Please upload both the files'
                });
            } else {
                data = [];

                formMessage = req.body.message;

                // loop all files
                console.log(req.files);
                _.forEach(_.keysIn(req.files), (key) => {
                    let photo = req.files[key];

                    // move photo to uploads directory
                    photo.mv('./uploads/' + photo.name);

                    // push file details
                    data.push(photo.name);
                });

                console.log(data);

                // return response
                try {
                    const url = await QRCode.toDataURL(qrCodeText);
                    res.render('index', { status: true, data: url });
                } catch (err) {
                    console.log("in err: " + err);
                    res.render('index', { status: true, data: 'wait' });
                }
            }
        }
    } catch (err) {
        res.status(500).send(err);
        console.log(err);
    }
});

// Creating Status CSV
setInterval(() => {
    try {
        if (isSent) {
            const createCsvWriter = require('csv-writer').createObjectCsvWriter;
            const csvWriter = createCsvWriter({
                path: 'uploads/status.csv',
                header: [
                    { id: 'mobno', title: 'Mobile No' },
                    { id: 'status', title: 'Status' },
                ]
            });
            csvWriter
                .writeRecords(csvData)
                .then(() => console.log('The CSV file was written successfully'));

            open("http://localhost:" + (process.env.PORT || 3000) + "/status");
            isSent = false;
            csvData = [];
            data = [];
            statusReady = true;
            client.destroy();
        }
    } catch (err) {
        console.log("Error while creating Status CSV: " + err);
    }
}, 1000);


app.use('/', router);
app.listen(process.env.PORT || 3000);

/* var server = app.listen(8081, function() {
    var host = server.address().address
    var port = server.address().port

    console.log("App listening at http://%s:%s", host, port)
}) */