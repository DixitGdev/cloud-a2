const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const fs = require('fs')
const app = express()
const AWS = require('aws-sdk')

const PORT = 3000
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

AWS.config.update({
    region: 'us-east-1',
    accessKeyId:'ASIA3G6TBONEVPBSEGHE',
    secretAccessKey: '6mPvmESD+IV8HGhfa2E9qn3PC9rL8TDRTmB0MzDq',
    aws_session_token: 'FwoGZXIvYXdzEH8aDNRfN6Ig/4ILRsr4YyLAAc8qI5+ayI/1F3XQIZauVqqJWKktb8pTqUuXrFxM9BSzVTn7sq4+5HNt1EDaMbuhYGkShnR48lI98+Cbdggwt3l2HBawX4BSqkIA6lpI9jg22oTN1k2ZWrkGex2HEbNT1q4d6vk3GpHMpDSzRb5/as9Erc2hOuDrTynNFu/4RSUNgDhcVl1f7GYAqM/GqQXFry9QOYAmEDPniRaWkwa+Uz9ITYTfIVvD075pOa4NrGos6Sjz00JuHM/2/tbLyAe30SiahuOfBjItMyvSy2LBjqLhKH16p3or3aRuGqMe6uOmJnw7yMeTyE7c766XcBAR38WSQdRE'
});

const s3 = new AWS.S3();

const params_upload = {
    Bucket: 'a2-bucket-dixit',
    Key: 'file.txt',
    Body: fs.createReadStream(__dirname+"/file.txt")
};

const params_URL = {
    Bucket: 'a2-bucket-dixit',
    Key: 'file.txt'
};

app.get('/', (req, res) => {
    res.send('Hello world!')
})


const postStart = async () => {
    try{
        const resp = await axios.get('http://localhost:5001/start');
        console.log(resp.data);
    } catch (err) {
        console.log(err);
    }
}

// Making POST request to start endpoint
postStart();


app.post('/storedata', (req, res) => {
    let data = req.body.data;

    if (data){
        try {
            s3.upload(params_upload, function(err, data){
                if (err){
                    res.status(500);
                    console.log("Error in uploading file: ", err);
                }
                else{
                    console.log("File uploaded Successfully", data.ETag);
                    const url = s3.getSignedUrl('getObject', params_URL);
                    res.json({s3uri : url});
                    res.status(200);
                }
            })
        }
        catch (err) {
            console.log(err);
            res.send(500);
        }
    }
    else{
        res.send(500);
    }
})

// APPEND CONTENT TO THE FILE
app.post('/appenddata', (req, res) => {
    const filePath = __dirname+"\file.txt";

    const bName = "a2-bucket-dixit";
    const keyName = "file.txt";

    const new_data = req.body.data.toString();
    if (new_data){
        s3.getObject({Bucket : bName, Key : keyName}, (err, data) => {
            if (err){
                console.log(err);
                res.status(500);
            } else {
                const oldContent = data.Body.toString();
                const updatedContent = oldContent + new_data;
                s3.putObject({
                    Bucket:bName,
                    Key:keyName,
                    Body:updatedContent
                }, (err, data) => {
                    if (err) {
                        res.status(500);
                        console.log(err);
                    } else {
                        console.log("File updated!")
                        const url = s3.getSignedUrl('getObject', params_URL);
                        res.json({s3uri : url});
                        res.status(200);
                    }
                })
            }
        })
    }
    else{
        res.send(500);
    }
})

app.post('/deletefile', (req, res) => {
    let fURI = req.body.s3uri;
    const match = fURI.match(/^s3:\/\/([^/]+)\/(.+)$/);
    if (!match) {
        console.log("Invalid S3 URI", fURI);
        return;
    }
    const bName = match[1];
    const key = match[2];

    const get_params = {
        Bucket: bName,
        Key: key
    };

    s3.deleteObject(get_params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success!", data);
        }
    })

})


// App server is listening
app.listen(PORT, (error) => {
    if (!error){
        console.log("Server is running on PORT: "+PORT)
    }
    else{
        console.log("Error Occured")
    }
})