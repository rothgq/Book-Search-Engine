const {User} = require('../models');
const {AuthenticationError} = require('apollo-server-express');
const {signToken} = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({_id: context.user._id})
                    .select('-__v -password')
                    .populate('books');

                return userData;
            }
            throw new AuthenticationError('Please log in for access.');
        }
    },

    Mutation: {
        login: async (parent, {email, password}) => {
            const user = await User.findOne({email});
            if (!user) {
                throw new AuthenticationError('That account information is not in our records.');
            }
            const correctPassword = await user.isCorrectPassword(password);
            if (!correctPassword) {
                throw new AuthenticationError('That account information is not in our records.');
            }
            const token = signToken(user);
            return {token, user};
        },
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return {token, user};
        },
        saveBook: async (parent, {bookData}, context) => {
            if (context.user) {
                const saveBook = await User.findOneAndUpdate({_id: context.user._id}, {$addToSet: {savedBooks: bookData}}, {new: true});
                return saveBook;
            }
            throw new AuthenticationError('Please log in for access.');
        },
        removeBook: async (parent, {bookData}, context) => {
            if (context.user) {
                const removedBook = await User.findOneAndUpdate({_id: context.user._id}, {$pull: {savedBooks: {bookData}}}, {new: true});
                return removedBook;
            }
            throw new AuthenticationError('Please log in for access.');
        }
    }
};

module.exports = resolvers;