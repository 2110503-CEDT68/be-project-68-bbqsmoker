const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 1. โหลด Model ตามไฟล์ที่คุณส่งมา
const User = require('../models/User');
const Company = require('../models/Company');
const Booking = require('../models/Booking');

// 2. โหลด Config (ปรับ path ตามที่โปรเจกต์คุณวางไว้)
dotenv.config({ path: './config/config.env' });

// 3. เชื่อมต่อฐานข้อมูล
// 3. เชื่อมต่อฐานข้อมูล (ลบตัวเลือกที่ Error ออก)
mongoose.connect(process.env.MONGO_URI);

// 4. ฟังก์ชันนำข้อมูลเข้า (Import Data)
const importData = async () => {
    try {
        console.log('⏳ Starting data import...');

        // ล้างข้อมูลเก่าออกก่อนเพื่อป้องกัน ID ซ้ำหรือข้อมูลขยะ
        await User.deleteMany();
        await Company.deleteMany();
        await Booking.deleteMany();

        // อ่านไฟล์ JSON
        const usersData = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
        const companiesData = JSON.parse(fs.readFileSync(`${__dirname}/companies.json`, 'utf-8'));
        const bookingsData = JSON.parse(fs.readFileSync(`${__dirname}/bookings.json`, 'utf-8'));

        // บันทึก Users และ Companies (Mongoose จะสร้าง ObjectId ใหม่ให้ที่นี่)
        const createdUsers = await User.create(usersData);
        const createdCompanies = await Company.create(companiesData);
        console.log('✅ Users & Companies created with new ObjectIds');

        // ทำการเชื่อมโยง (Mapping) ข้อมูล Booking เข้ากับ ID ใหม่ที่เพิ่งสร้าง
        const finalBookings = bookingsData.map(booking => ({
            bookingDate: booking.bookingDate,
            // ใช้ Index ที่ระบุไว้ใน JSON เพื่อชี้ไปหา ID จริงใน Database
            user: createdUsers[booking.userIndex]._id,
            company: createdCompanies[booking.companyIndex]._id,
            createdAt: new Date()
        }));

        // บันทึกรายการจองลง Database
        await Booking.create(finalBookings);

        console.log('✅ 60 Bookings linked and created successfully!');
        process.exit();
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

// 5. ฟังก์ชันลบข้อมูลทั้งหมด (Delete Data)
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

// 6. จัดการคำสั่งผ่าน Terminal
if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
}