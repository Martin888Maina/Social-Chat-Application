//This file is used for error handling within the routes of the api.js file
//It is important to note that to confirm what is being imported into a file you will see the key words CONST at the top of the file page and you will see the keywords such as mongoose or Student being used in the body of the file.

//Importing  Student from studentModels.js
// const { default: mongoose } = require('mongoose');
const mongoose    = require('mongoose');
const Message     = require('../models/messageModel');
const createError = require('http-errors');

//Alternative method to exporting. This is the recommended method.
//In this method you will place the POST, GET, PATCH AND DELETE CODE inside of the module.exports.

module.exports = {

            SaveMessage: async (req, res, next) => {
                const { sender, receiver, content } = req.body;

                // Validate sender and receiver are valid ObjectId
                if (!mongoose.Types.ObjectId.isValid(sender) || !mongoose.Types.ObjectId.isValid(receiver)) {
                    return next(createError(400, 'Invalid sender or receiver ID'));
                }

                try {
                    const newMessage = new Message({ sender, receiver, content });
                    const result = await newMessage.save();
                    res.status(201).json(result);
                } catch (error) {
                    console.error('Error saving message:', error.message);
                    next(createError(500, 'Failed to send message'));
                }
            },

            //POST-ADDING TO THE DATABASE
            //paste the following code lifted from the api.js file:
            //This is the error handling code for the POST request
            AddMessage: async (req, res, next)=>{
                //add student is a Method
                //note that code has changed for students to student.
                try{
                    
                    const message = new Message(req.body)
                    const result  = await message.save();
                    res.send(result);
                }catch(error){
                    console.log(error.message);
                    //error validation
                    if(error.name === "ValidationError"){
                        next(createError(422, error.message))
                        return;
                    }
                    next(error)
                } 
            },  //incase you want to add another code you will use a comma after the closing curly brace. (,)
             
            //Code to output ALL student in POSTMAN without the ID option
            GetAllMessage: async (req, res, next)=>{
                try{
                    
                    const result = await Message.find({})
                    res.send(result)
                }catch(error){
                    console.log(error.message)
                    //global error handling has been added. In case of any errors check this code section.
                    //error validation
                    if(error.name === "ValidationError"){
                        next(createError(422, error.message))
                        return;
                    }
                    next(error)
                }
            },

            //GET - RETRIEVING FROM THE DATABASE
            //past the following code lifted from the api.js file:
            //This is the error handling code for the GET request.
            //I replaced student with result.
            //Code to output a single student information in POSTMAN using an ID option.
            GetMessage: async (req, res, next)=>{
                //note that code has changed from students to student.
                const _id = req.params._id;// This line of code makes it possible to get what is present in the url

                try{

                    // Check if id is a valid ObjectId
                    if (!_id.match(/^[0-9a-fA-F]{24}$/) || !mongoose.Types.ObjectId.isValid(_id)) {
                        throw createError(400, 'Invalid message id');
                    }

                    const result = await Message.findById(_id);
                    if(!result){
                        throw(createError(404,"Message does not exist"))
                    }
                    res.send(result)
                }catch(error){
                    console.log(error.message);
                    if(error instanceof mongoose.CastError){
                        next(createError(400, "Invalid message id"));
                        return;
                    }
                    next(error);
                }
                
            },
            
            //PATCH - UPDATING THE DATABASE
            //This is the same approach as the DELETE when placing the error handling
            //paste the following code lifted from the api.js file:
            //Update has been edited accordingly.
            ChangeMessage: async(req, res, next) => {
                // console.log(req.params.id);
                //next has been edited out of the code:
                //patch and put are used interchangeably
                const _id      = req.params._id;
                try{
                    // Check if id is a valid ObjectId
                    if (!_id.match(/^[0-9a-fA-F]{24}$/) || !mongoose.Types.ObjectId.isValid(_id)) {
                        throw createError(400, 'Invalid message id');
                    }

                    const update  = req.body;
                    const options = {new: true};
                    const result  = await Student.findByIdAndUpdate(_id, update, options);
                    if(!result){
                        throw(createError(404, "Message does not Exist"))
                    }
                    res.send(result);

                }catch(error){
                    console.log(error.message);
                    //error validation
                    if(error instanceof mongoose.CastError){
                        next(createError(400, "Invalid message id"));
                        return;
                    }
                    next(error)
                } 
            }, 

            //DELETE - DELETING THE DATABASE
            //paste the following lifted from the api.js file:
            EraseMessage: async(req, res, next) => {
                const _id = req.params._id
                try{
                    // Check if id is a valid ObjectId
                    if (!_id.match(/^[0-9a-fA-F]{24}$/) || !mongoose.Types.ObjectId.isValid(_id)) {
                        throw createError(400, 'Invalid message id');
                    }
                    
                    const result = await Message.findByIdAndRemove(_id);
                    if(!result){
                        throw(createError(404,"Message does not exist"))
                    }
                    res.send(result);

                }catch (error){
                    console.log(error.message);//confirm the semi-colon at this point
                    //error validation
                    if(error instanceof mongoose.CastError){
                        next(createError(400, "Invalid message id"));
                        return;
                    }
                    next(error)
                }
            },

            GetMessagesBetweenUsers: async (req, res, next) => {
                const { senderId, receiverId } = req.params;

                // Check if IDs are valid
                if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
                    return next(createError(400, 'Invalid sender or receiver ID'));
                }
                    
                try {
                    const messages = await Message.find({
                        $or: [
                            { sender: senderId, receiver: receiverId },
                            { sender: receiverId, receiver: senderId }
                        ]
                    }).sort({ timestamp: 1 }); // Sort messages by timestamp
        
                    res.status(200).json(messages);
                } catch (error) {
                    console.error('Error fetching messages:', error.message);
                    next(createError(500, 'Failed to fetch messages'));
                }
            },

            SearchMessages: async (req, res, next) => {
                const { userId, receiverId } = req.params;
                const { query } = req.query;
        
                try {
                    const messages = await Message.find({
                        $or: [
                            { sender: userId, receiver: receiverId },
                            { sender: receiverId, receiver: userId }
                        ],
                        content: { $regex: query, $options: 'i' } // Case-insensitive search
                    }).sort({ timestamp: 1 });
        
                    res.status(200).json(messages);
                } catch (error) {
                    console.error('Error searching messages:', error.message);
                    next(createError(500, 'Failed to search messages'));
                }
            }

}
