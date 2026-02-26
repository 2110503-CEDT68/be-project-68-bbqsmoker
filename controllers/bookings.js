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
            select: 'name province tel'
        });
    } else{
        if(req.params.companyId){
            console.log(req.params.companyId);
            query = Booking.find({ company: req.params.companyId }).populate({
                path: 'company',
                select: 'name province tel'
            });
        } else {
            query = Booking.find().populate({ 
                path: 'company',   
                select: 'name province tel'
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
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate({
      path: "company",
      select: "name province tel",
    });
    if (!booking) {
      return res
        .status(404)
        .json({
          success: false,
          message: ` No booking with the id of ${req.params.id}`,
        });
    }
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Cannot find Booking" });
  }
};
// @desc    Add booking
// @route   POST /api/v1/companies/:companyId/bookings
// @access  Private
exports.addBooking = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    req.body.company = req.params.companyId;

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
    req.body.company = req.params.companyId;

    const company = await Company.findById(req.params.companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: `No company with the id of ${req.params.companyId}`,
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