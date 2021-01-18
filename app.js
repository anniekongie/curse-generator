var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var fs = require('fs');
AWS.config.region = process.env.REGION;

var app = express();
var port = process.env.PORT || 8081;
var dictionary = { adultCurseWords: [], adultInsults: [], pgInsults: [], pgCurseWords: [] };

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(cors());
const loadWords = async function () {
    await fs.readdir('static', (err, files) => {
        try {
            files.forEach(file => {
                var listIdentifier = `${file}`.slice(0, -4);
                const wordList = fs.readFileSync(`static/${file}`, 'utf8');
                var array = wordList.split("\n");
                array = array.filter(x => { return x != '' });
                dictionary[listIdentifier] = array;
            });
        } catch (err) {
            console.log(err);
        }
    })
};

const getRandomInt = (max) => {
    return Math.floor(Math.random() * (max + 1));
}

const generate = async (type, rating) => {
    var wordList;
    switch (rating) {
        case 'PG':
            if (type === 'insult') {
                wordList = dictionary['pgInsults'];
            } else { wordList = dictionary['pgCurseWords'] }
            break;
        case 'R':
            if (type === 'insult') {
                wordList = dictionary['adultInsults'];
            } else { wordList = dictionary['adultCurseWords'] }
            break;
    }
    var randInd = getRandomInt(wordList.length-1);
    return wordList[randInd];
}

(async () => {
    try {
        await loadWords();
    } catch (e) {
        console.log(e);
    }
})();

app.get('/', (req, res) => {res.send('Are you cussin\' me? ')})
app.post('/generate', async function (req, res) {
    console.log(req)
    var lookingFor = {
        type: req.body.type,
        rating: req.body.rating,
    }
    try {
        await generate(lookingFor.type, lookingFor.rating).then(result => {
            res.status(200).send(result)
        })
    } catch (error) {
        return console.log(error);
    }
})

var server = app.listen(port, () => console.log(`Server listening on port ${port}`));