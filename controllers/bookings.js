const Booking = require('../models/Booking');
const Company = require('../models/Company');
// @desc Get all appointments
// @route GET /api/v1/bookings 
// @access Public
exports.getBookings = async (req, res, next) => {
    let query;
    if(req.user.role !== 'admin'){
        query = Booking.find({ user: req.user.id }).populate({
            path: 'company',
            select: 'name address telephone_number website description'
        });
    } else{
        if(req.params.id){
            console.log(req.params.id);
            query = Booking.find({ company: req.params.id }).populate({
                path: 'company',
                select: 'name address telephone_number website description'
            });
        } else {
            query = Booking.find().populate({ 
                path: 'company',   
                select: 'name address telephone_number website description'
            });
        }
    }
    try {
        const bookings = await query;
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    }
        catch (err) {
            console.log(err);
            return res.status(500).json({ success: false, message: 'Cannot find Bookings' });
    }
    };
   
//@desc Get single booking
//@route GET /api/v1/bookings/:id
//@access Public
// @desc    Get single booking
// @route   GET /api/v1/bookings/:id
// @access  
exports.getBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate({
            path: "company",
            select: "name address telephone_number website description",
        });

        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with the id of ${req.params.id}` });
        }

        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                message: `User ${req.user.id} is not authorized to view this booking` 
            });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Cannot find Booking" });
    }
};
// @desc    Add booking
// @route   POST /api/v1/companies/:id/bookings
// @access  Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    req.body.company = req.params.id;

    // Validate and sanitize bookingDate
    if (!req.body.bookingDate || isNaN(Date.parse(req.body.bookingDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking date format. Please provide a valid ISO 8601 date string.',
      });
    }

    // Ensure bookingDate is properly formatted
    req.body.bookingDate = new Date(req.body.bookingDate).toISOString();

    const bookingDate = new Date(req.body.bookingDate);
    const minDate = new Date('2022-05-10T00:00:00Z');
    const maxDate = new Date('2022-05-13T23:59:59Z');

    if (bookingDate < minDate || bookingDate > maxDate) {
      return res.status(400).json({
        success: false,
        message: 'Booking date must be between May 10th and May 13th, 2022'
      });
    }
    const existedBookings = await Booking.find({ user: req.user.id });
    if (existedBookings.length >= 3 && req.user.role !== "admin") {
      return res.status(400).json({
        success: false,
        message: `The user with ID ${req.user.id} has already made 3 bookings`,
      });
    }
    req.body.company = req.params.id;

    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: `No company with the id of ${req.params.id}`,
      });
    }
    const booking = await Booking.create(req.body);
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Cannot create Booking",
    });
  }
};
//@desc Update booking
//@route PUT /api/v1/bookings/:id
//@access Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No booking with the id of ${req.params.id}`,
        });
    }
    //Make sure user is the booking owner
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message: `User ${req.user.id} is not authorized to update this booking`,
        });
    }
    // Validate bookingDate range if provided
    if (req.body.bookingDate) {
      if (isNaN(Date.parse(req.body.bookingDate))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking date format. Please provide a valid ISO 8601 date string.',
        });
      }
      const bookingDate = new Date(req.body.bookingDate);
      const minDate = new Date('2022-05-10T00:00:00Z');
      const maxDate = new Date('2022-05-13T23:59:59Z');
      if (bookingDate < minDate || bookingDate > maxDate) {
        return res.status(400).json({
          success: false,
          message: 'Booking date must be between May 10th and May 13th, 2022',
        });
      }
    }
    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot update Booking" });
  }
};
//@desc Delete booking
//@route DELETE /api/v1/bookings/:id
//@access Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res
        .status(404)
        .json({
          success: false,
          message: `No booking with the id of ${req.params.id}`,
        });
    }
    if (
      booking.user.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(401)
        .json({
          success: false,
          message: `User ${req.user.id} is not authorized to delete this booking`,
        });
    }
    await booking.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot delete Booking" });
  }
};