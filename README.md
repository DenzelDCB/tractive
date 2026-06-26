# Factive - Student Pass Management System

Factive helps teachers track student movement between classes using virtual passes. This addresses the problem of students skipping classes by creating a record of when students should leave one class and arrive at another.

## Features

- **Teacher Authentication**: Secure login/registration for teachers
- **Create Virtual Passes**: Teachers can create passes for students to move between classes
- **View Received Passes**: Teachers can see passes sent to them from other teachers
- **Verify Passes**: Check if a student is meant to be in a specific class at a specific time
- **Manage Students**: Add and view students in the system
- **Pass Status Tracking**: Mark passes as completed or cancelled
- **Cloud Database**: MongoDB Atlas for data accessible from anywhere

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB Atlas (Free Tier):
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free account
   - Create a new cluster (free tier M0)
   - Create a database user with username and password
   - Whitelist IP address `0.0.0.0/0` (allows access from anywhere)
   - Get your connection string from the "Connect" button

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Replace the MongoDB connection string with your Atlas connection string
   - Update the JWT_SECRET if desired

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000/login.html` in your browser
2. Register as a teacher (you'll need at least 2 teachers to test the full flow)
3. Add students to the system
4. Create passes for students to move between classes
5. View received passes from other teachers
6. Verify if a student is meant to be in your class

## How It Works

1. **Teacher A** creates a pass for a student to leave their class and go to Teacher B's class
2. The pass includes: student name, departure time, arrival time, from class, to class
3. **Teacher B** receives the pass and can see it in their "Received Passes" list
4. When a student appears in Teacher B's class, Teacher B can verify the pass
5. The verification checks if the student has an active pass for that class and if the current time is within the valid time window
6. Teacher B can mark the pass as "completed" when the student arrives

## API Endpoints

- `POST /api/register` - Register a new teacher
- `POST /api/login` - Login as a teacher
- `GET /api/teachers` - Get all teachers (except current user)
- `POST /api/students` - Add a new student
- `GET /api/students` - Get all students
- `POST /api/passes` - Create a new pass
- `GET /api/passes/received` - Get passes received by current teacher
- `GET /api/passes/created` - Get passes created by current teacher
- `GET /api/passes/verify` - Verify if a student has a valid pass
- `PUT /api/passes/:id/status` - Update pass status

## Data Storage

The system uses MongoDB Atlas (cloud database) for data storage. This allows the application to be accessible from anywhere and enables multiple devices to access the same data.

## Security

- Passwords are hashed using bcryptjs
- JWT tokens are used for authentication
- Teachers can only update passes sent to them
- MongoDB Atlas provides built-in security features

## Deployment

To deploy to a cloud platform (Render, Railway, etc.):

1. Push your code to GitHub
2. Create a new web service on your chosen platform
3. Add your MongoDB connection string as an environment variable (`MONGODB_URI`)
4. Add your JWT secret as an environment variable (`JWT_SECRET`)
5. Deploy the application

The application will then be accessible from anywhere with an internet connection.
