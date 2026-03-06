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



// Hash the password before saving the user
registerSchema.pre('save', async function(next) {
    console.log('Hashing password for user:', this.email); // Log email for context
    console.log('Password before hashing:', this.password); // Log password before hashing
    try {

        // Check if the password is already hashed
        if (!this.isModified('password')) {
            // If password field is not modified, skip hashing
            return next();
        }

        const salt = await bcrypt.genSalt(10);
        console.log('Generated salt:', salt); // Log the salt
        const hashedPwd = await bcrypt.hash(this.password, salt);
        console.log('Hashed password:', hashedPwd); // Log the hashed password
        this.password = hashedPwd;
        next();
    } catch (error) {
        console.error('Error hashing password:', error); // Log the error
        next(error);
    }
});

// Method to compare the hashed password with the user input password
registerSchema.methods.isValidPassword = async function(password) {
    console.log('Comparing password for user:', this.email); // Log email for context
    console.log('Stored hashed password:', this.password); // Log the hashed passwor
    try {
        const result = await bcrypt.compare(password, this.password);
        console.log('Password match result:', result); // Log the comparison result
        return result;
    } catch (error) {
        console.error('Error comparing passwords:', error); // Log the error
        throw error;
    }
}

// Create the model from the schema
const Register = mongoose.model('Register', registerSchema);

module.exports = Register;






