var AWS = require('aws-sdk');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
AWS.config.region = process.env.REGION;

// var ddb = new AWS.DynamoDb();
// var insultTable = process.env.INSULT_TABLE;

var app = express();
var port = process.env.PORT || 8081;
var dictionary = { adultCurseWords: [], adultInsults: [], pgInsults: [], pgCurseWords: [] };

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: false }));

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

// homePage
app.get('/', function (req, res) {
    res.render('index', {
        static_path: 'static',
    });
});

app.get('/about', function (req, res) {
    res.render('about', {
        static_path: 'static',
    })
})

app.get('/generate', function (req, res) {
    var lookingFor = {
        type: req.query.type,
        rating: req.query.rating,
    }
    console.log('The user is looking for', lookingFor.rating, lookingFor.type);
    res.render('generator', {
        type: lookingFor.type,
        rating: lookingFor.rating,
        result: null,
        static_path: 'static',
    })
});

app.post('/generate', async function (req, res) {
    var lookingFor = {
        type: req.query.type,
        rating: req.query.rating,
    }
    try {
        await generate(lookingFor.type, lookingFor.rating).then(result=> {
            res.render('generator', {
                type: lookingFor.type,
                rating: lookingFor.rating,
                result: result,
                static_path: 'static',
            })
        })
    } catch (error) {
        return console.log(error);
    }
})

var server = app.listen(port);