var express = require('express');
var jszip = require('jszip')
var path = require('path')

var app = express();
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'))
})

app.post('/createFile', (req, res) => {
    console.log("Create File request received.")
    console.log(req)
    createScaleFile(req.body.scaledata)
    res.send('file created')
})

var server = app.listen(8080, function() {
    var host= server.address().address
    var port = server.address().port
    console.log("Listening at http://%s:%s", host, port)
})

function createScaleFile(data, filename="scale.mnlgtuns") {
    zip = new jszip()
    zip.file('TunO_000.Tun0_bin', data)
    zip.file('.tuneScaleInformation.xml')
    zip.file('.fileInformation.xml')
    //zip.generateAsync({type: 'blob'}).then( (blob) => saveAs(blob, filename))
}