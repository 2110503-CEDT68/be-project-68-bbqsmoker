const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load models
const User = require('../models/User');
const Company = require('../models/Company');
const Booking = require('../models/Booking');

// Load config
dotenv.config({ path: './config/config.env' });

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Import data
const importData = async () => {
    try {
        console.log('⏳ Starting data import...');

        // Clear existing data
        await User.deleteMany();
        await Company.deleteMany();
        await Booking.deleteMany();

        // Read JSON files
        const usersData = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
        const companiesData = JSON.parse(fs.readFileSync(`${__dirname}/companies.json`, 'utf-8'));
        const bookingsData = JSON.parse(fs.readFileSync(`${__dirname}/bookings.json`, 'utf-8'));

        // Create users and companies (Mongoose generates new ObjectIds)
        const createdUsers = await User.create(usersData);
        const createdCompanies = await Company.create(companiesData);
        console.log('✅ Users & Companies created with new ObjectIds');

        // Map bookings to real ObjectIds
        const finalBookings = bookingsData.map(booking => ({
            bookingDate: booking.bookingDate,
            user: createdUsers[booking.userIndex]._id,
            company: createdCompanies[booking.company_id]._id,
            createdAt: new Date()
        }));

        // Save bookings to database
        await Booking.create(finalBookings);

        console.log('✅ 60 Bookings linked and created successfully!');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

// Delete all data
const deleteData = async () => {
    try {
        await User.deleteMany();
        await Company.deleteMany();
        await Booking.deleteMany();
        console.log('🗑️ All data destroyed...');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

// Handle terminal commands
if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
}