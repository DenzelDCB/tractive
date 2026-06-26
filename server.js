const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');
const { Teacher, Student, Pass } = require('./models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'factive-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('factive'));

// Initialize database
initDatabase();

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, full_name } = req.body;
    
    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if username already exists
    const existingTeacher = await Teacher.findOne({ username });
    if (existingTeacher) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newTeacher = new Teacher({
      username,
      password: hashedPassword,
      full_name
    });
    
    await newTeacher.save();
    
    res.json({ message: 'Teacher registered successfully', teacherId: newTeacher._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const teacher = await Teacher.findOne({ username });
    
    if (!teacher) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, teacher.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: teacher._id, username: teacher.username, full_name: teacher.full_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, teacher: { id: teacher._id, username: teacher.username, full_name: teacher.full_name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Student Routes
app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Student name required' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ name });
    if (existingStudent) {
      return res.status(400).json({ error: 'Student already exists' });
    }

    const newStudent = new Student({ name });
    await newStudent.save();
    
    res.json({ message: 'Student added successfully', studentId: newStudent._id });
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Failed to add student' });
  }
});

app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const students = await Student.find().sort({ name: 1 });
    res.json(students);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Pass Routes
app.post('/api/passes', authenticateToken, async (req, res) => {
  try {
    const { student_name, to_teacher_username, from_class, to_class, departure_time, arrival_time } = req.body;
    
    if (!student_name || !to_teacher_username || !from_class || !to_class || !departure_time || !arrival_time) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get student
    const student = await Student.findOne({ name: student_name });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get to_teacher
    const toTeacher = await Teacher.findOne({ username: to_teacher_username });
    if (!toTeacher) {
      return res.status(404).json({ error: 'Destination teacher not found' });
    }

    const fromTeacherId = req.user.id;
    const toTeacherId = toTeacher._id;

    const newPass = new Pass({
      student_id: student._id,
      from_teacher_id: fromTeacherId,
      to_teacher_id: toTeacherId,
      from_class,
      to_class,
      departure_time,
      arrival_time,
      status: 'active'
    });
    
    await newPass.save();
    
    res.json({ message: 'Pass created successfully', passId: newPass._id });
  } catch (error) {
    console.error('Create pass error:', error);
    res.status(500).json({ error: 'Failed to create pass' });
  }
});

app.get('/api/passes/received', authenticateToken, async (req, res) => {
  try {
    const passes = await Pass.find({ to_teacher_id: req.user.id, status: 'active' })
      .populate('student_id')
      .populate('from_teacher_id')
      .populate('to_teacher_id')
      .sort({ departure_time: -1 });
    
    const formattedPasses = passes.map(p => ({
      ...p.toObject(),
      student_name: p.student_id ? p.student_id.name : 'Unknown',
      from_teacher_name: p.from_teacher_id ? p.from_teacher_id.full_name : 'Unknown',
      from_teacher_username: p.from_teacher_id ? p.from_teacher_id.username : 'Unknown',
      to_teacher_name: p.to_teacher_id ? p.to_teacher_id.full_name : 'Unknown'
    }));
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Fetch received passes error:', error);
    res.status(500).json({ error: 'Failed to fetch received passes' });
  }
});

app.get('/api/passes/created', authenticateToken, async (req, res) => {
  try {
    const passes = await Pass.find({ from_teacher_id: req.user.id })
      .populate('student_id')
      .populate('from_teacher_id')
      .populate('to_teacher_id')
      .sort({ departure_time: -1 });
    
    const formattedPasses = passes.map(p => ({
      ...p.toObject(),
      student_name: p.student_id ? p.student_id.name : 'Unknown',
      from_teacher_name: p.from_teacher_id ? p.from_teacher_id.full_name : 'Unknown',
      to_teacher_name: p.to_teacher_id ? p.to_teacher_id.full_name : 'Unknown'
    }));
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Fetch created passes error:', error);
    res.status(500).json({ error: 'Failed to fetch created passes' });
  }
});

app.get('/api/passes/verify', authenticateToken, async (req, res) => {
  try {
    const { student_name, class_name } = req.query;
    
    if (!student_name || !class_name) {
      return res.status(400).json({ error: 'Student name and class name required' });
    }

    const student = await Student.findOne({ name: student_name });
    if (!student) {
      return res.json({ valid: false, reason: 'Student not found' });
    }

    const pass = await Pass.findOne({ 
      student_id: student._id, 
      to_class: class_name, 
      status: 'active' 
    }).sort({ departure_time: -1 });
    
    if (pass) {
      // Check if current time is within departure and arrival time
      const now = new Date();
      const departure = new Date(pass.departure_time);
      const arrival = new Date(pass.arrival_time);
      
      if (now >= departure && now <= arrival) {
        res.json({ 
          valid: true, 
          pass: {
            student_name: student_name,
            from_class: pass.from_class,
            to_class: pass.to_class,
            departure_time: pass.departure_time,
            arrival_time: pass.arrival_time
          }
        });
      } else {
        res.json({ 
          valid: false, 
          reason: 'Not within valid time window',
          pass: {
            student_name: student_name,
            from_class: pass.from_class,
            to_class: pass.to_class,
            departure_time: pass.departure_time,
            arrival_time: pass.arrival_time
          }
        });
      }
    } else {
      res.json({ valid: false, reason: 'No active pass found' });
    }
  } catch (error) {
    console.error('Verify pass error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.put('/api/passes/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const pass = await Pass.findOneAndUpdate(
      { _id: id, to_teacher_id: req.user.id },
      { status },
      { new: true }
    );
    
    if (!pass) {
      return res.status(404).json({ error: 'Pass not found or unauthorized' });
    }
    
    res.json({ message: 'Pass status updated successfully' });
  } catch (error) {
    console.error('Update pass status error:', error);
    res.status(500).json({ error: 'Failed to update pass status' });
  }
});

// Get all teachers (for creating passes)
app.get('/api/teachers', authenticateToken, async (req, res) => {
  try {
    const teachers = await Teacher.find({ _id: { $ne: req.user.id } })
      .select('id username full_name');
    res.json(teachers);
  } catch (error) {
    console.error('Fetch teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

app.listen(PORT, () => {
  console.log(`Factive server running on http://localhost:${PORT}`);
});
