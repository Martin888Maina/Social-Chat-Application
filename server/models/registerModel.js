const mongoose = require('mongoose'); // Importing mongoose
const Schema   = mongoose.Schema;     // Importing the MongoDB schema
const bcrypt   = require('bcrypt');

// Create the schema for user registration
const registerSchema = new Schema({
    firstname: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastname: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensures the email is unique
        trim: true
    },
    telephone: {
        type: String,
        required: [true, 'Telephone number is required'],
        unique: true, // Ensures the telephone number is unique
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
    },
    profilePicture: { // New field for storing the profile picture URL
        type: String,
        trim: true,
        default: "" // Set default value to an empty string
    }
}, {
    timestamps: true // Automatically manage createdAt and updatedAt fields
});



// hash password before saving — skip if it wasn't changed
registerSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) return next();
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// compare the plain text input against the stored hash
registerSchema.methods.isValidPassword = async function(password) {
    try {
        return await bcrypt.compare(password, this.password);
    } catch (error) {
        throw error;
    }
}

// Create the model from the schema
const Register = mongoose.model('Register', registerSchema);

module.exports = Register;






