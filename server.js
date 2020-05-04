var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var User = require('./Users');
var News = require('./News');
var jwt = require('jsonwebtoken');
var cors = require("cors");
var authJwtController = require('./auth_jwt');
var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(passport.initialize());
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);
var router = express.Router();
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('48ff150608044a98bfe20a67ca18f399');


router.use('/today', passport.authenticate('jwt', { //Top news today in denver via http method get
    session: false
}), (req, res) => {

    if (req.method == 'GET') {

        newsapi.v2.everything({//Use news api to gather news from today and send them to client.
            domains: 'denverpost.com',
            language: 'en',
            sortBy: 'publishedAt',
        }).then(response => {
            res.status(200).send({
                message: "GET today",
                headers: req.headers,
                query: req.query,
                response: response
            });
        });

    }

    else if (req.method == 'POST') { //Save a news article to display later


        //Create a news schema and add parameters from request.
        var  NewsToSave = new  News();
        NewsToSave.title = req.body.title;
        NewsToSave.url = req.body.url;
        NewsToSave.urlToImage  = req.body.urlToImage;
        NewsToSave.content  = req.body.content;
        NewsToSave.username  = req.user.username;



        NewsToSave.save(function(err) {
                    if (err) {
                        return res.json({ success: false, message: 'Could not save news.'});
                    }

                    else{
                        res.status(200).send({
                            success: true,
                            message: "Article Saved",
                            headers: req.headers,
                            query: req.query,
                            env: process.env.SECRET_KEY
                        });
                    }
                });

    }

    else {
        res.send("HTTP request not supported.");
        res.end();
    }

});


router.use('/saved', passport.authenticate('jwt', { //Returns the saved news articles of a user
    session: false
}), (req, res) => {

    if (req.method == 'GET') {

        News.find({username: req.user.username}, function(err, articles) {//Look in news schema for news that were saved by username
            var articlesMap = {};//Create a map(array) to place news and send the map to the client

            if (!err) {
                articles.forEach(function (article) {//Iterate through articles and add to map

                    articlesMap[article._id] = article;
                });
                res.status(200).send({
                    message: "GET saved articles",
                    headers: req.headers,
                    query: req.query,
                    env: process.env.SECRET_KEY,
                    savedNews: articlesMap
                });
            } else {
                return res.json({success: false, message: 'Could not GET'});
            }

        })
    } else {
        res.send("HTTP request not supported.");
        res.end();
    }

});

router.post('/signup', function(req, res) {
    if (!req.body.name || !req.body.username || !req.body.password) {//Error checking
        res.json({success: false, message: 'Please pass name, username, and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    if (!userNew.username || !userNew.password){//Error checking
        res.json({success: false, msg: 'Please pass username, and password.'});
    }
    else{

        User.findOne({ username: userNew.username }).select('namername password').exec(function(err, user) {
            if (err) res.send(err);

            user.comparePassword(userNew.password, function(isMatch){//Compare with jwt token
                if (isMatch) {
                    var userToken = {id: user._id, username: user.username};
                    var token = jwt.sign(userToken, process.env.SECRET_KEY);
                    res.json({success: true, token: 'JWT ' + token});
                }
                else {
                    res.status(401).send({success: false, message: 'Authentication failed.'});
                }
            });


        });
    }

});

router.use('/*', function (req, res) {
    //No base URL requests allowed.
    res.status(401).send({message:"No base URL requests allowed", headers: req.headers, query: req.query});
});

app.use('/', router);
app.listen(process.env.PORT || 8080);
