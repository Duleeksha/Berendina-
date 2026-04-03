import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'duleekshabandara@gmail.com', 
    pass: 'aczi afwl ieuc pjnr'      
  }
});

export default transporter;
