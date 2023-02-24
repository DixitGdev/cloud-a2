const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')
const fs = require('fs')
const app = express()
const AWS = require('aws-sdk')

const PORT = 5000
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

AWS.config.update({
    region: 'us-east-1',
    accessKeyId:'ASIA3G6TBONE6RDHYIHU',
    secretAccessKey:'IV4eYVKOfSFmQZ7FE/5qwCYCR7Jwac10PFv/rnKR',
    sessionToken: 'FwoGZXIvYXdzEH8aDNRfN6Ig/4ILRsr4YyLAAc8qI5+ayI/1F3XQIZauVqqJWKktb8pTqUuXrFxM9BSzVTn7sq4+5HNt1EDaMbuhYGkShnR48lI98+Cbdggwt3l2HBawX4BSqkIA6lpI9jg22oTN1k2ZWrkGex2HEbNT1q4d6vk3GpHMpDSzRb5/as9Erc2hOuDrTynNFu/4RSUNgDhcVl1f7GYAqM/GqQXFry9QOYAmEDPniRaWkwa+Uz9ITYTfIVvD075pOa4NrGos6Sjz00JuHM/2/tbLyAe30SiahuOfBjItMyvSy2LBjqLhKH16p3or3aRuGqMe6uOmJnw7yMeTyE7c766XcBAR38WSQdRE'
});

const s3 = new AWS.S3();


app.get('/', (req, res) => {
    res.send('Hello world!')
})


const postStart = async () => {
    const resp = await axios.post('http://52.91.127.198:8080/start', {
        banner: "B00913652",
        ip: "100.25.159.24:5000"
    })
    console.log(resp.data);
    
}

// Making POST request to start endpoint
postStart();


app.post('/storedata', (req, res) => {
    console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhh");
    const rData = req.body.data;
    console.log(rData);

    s3.upload({
        Bucket: 'a2-bucket-dixit',
        Key: 'file.txt',
        Body: rData
    }, function(err, data){
        if (err){
            res.status(500);
            console.log("Error in uploading file: ", err);
        }
        else{
            console.log("File uploaded Successfully", data.Location);
            const url = data.Location;
            res.status(200).send({s3uri : url})
        }
    })

});

// APPEND CONTENT TO THE FILE
app.post('/appenddata', (req, res) => {
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
                        res.sendStatus(200);
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
    const get_params = {
        Bucket: "a2-bucket-dixit",
        Key: "file.txt"
    };

    s3.deleteObject(get_params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            res.sendStatus(200);
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