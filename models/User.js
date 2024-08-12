const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    github: {
        type: String
    },
    profilePicture: {
        type: String
    },
    cv: {
        type: String
    }
});

// fire a function after doc saved to db
userSchema.post('save', function(doc, next){
    console.log('new user was created & saved', doc);
    next();
    
})
// fire a function before doc saved to db
userSchema.pre('save', async function(next) {
    console.log('user about to created and save to db', this);
    const salt = 10;
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// static method to login user
userSchema.statics.login = async function(email, password) {
    const user = await this.findOne({email});
    if (!user) {
        return res.status(400).json({ error: "Utilisateur non trouvé." });
    }
        const auth = await bcrypt.compare(password, user.password);
        if(auth){
            return user;
        }
        throw Error('Failed auth');
}

const User = mongoose.model('User', userSchema);

module.exports = User;
