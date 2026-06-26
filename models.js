const mongoose = require('mongoose');

// Teacher Schema
const teacherSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

// Student Schema
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now }
});

// Pass Schema
const passSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  from_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  to_teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  from_class: { type: String, required: true },
  to_class: { type: String, required: true },
  departure_time: { type: Date, required: true },
  arrival_time: { type: Date, required: true },
  status: { type: String, default: 'active', enum: ['active', 'completed', 'cancelled'] },
  created_at: { type: Date, default: Date.now }
});

const Teacher = mongoose.model('Teacher', teacherSchema);
const Student = mongoose.model('Student', studentSchema);
const Pass = mongoose.model('Pass', passSchema);

module.exports = { Teacher, Student, Pass };
