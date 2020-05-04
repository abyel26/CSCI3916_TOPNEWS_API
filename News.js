var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);


// News Object
var NewsSchema = new Schema({
    username: String, //username of user that saved the movie
    websiteName: String,
    title: String,
    url: String,
    urlToImage: String,
    content: String
});


// hash the password before the user is saved
NewsSchema.pre('save', function(next) {
    return next();
});

// return the model
module.exports = mongoose.model('news', NewsSchema);