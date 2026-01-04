# Room Renting System

A full-stack MERN (MongoDB/MySQL, Express, React, Node.js) application for room rental management with role-based access control. The system supports three user roles: Admin, Owner, and Tenant.

## Features

### Admin
- Approve/reject owner registrations
- View system statistics (total users, rooms, bookings, pending owners)
- Dashboard with overview metrics

### Owner
- Register and wait for admin approval
- Create, update, and delete room listings
- Manage room availability
- View and manage bookings for their rooms
- Update booking statuses (confirm, cancel)

### Tenant
- Browse available rooms with filters (city, price range, bedrooms)
- View room details
- Book rooms with check-in/check-out dates
- View booking history
- Cancel bookings

## Tech Stack

### Backend
- Node.js with Express.js
- Prisma ORM
- MySQL/MariaDB database
- JWT authentication
- bcryptjs for password hashing

### Frontend
- React 19
- React Router for navigation
- Tailwind CSS for styling
- Axios for API calls
- Vite as build tool

## Prerequisites

- Node.js (v18 or higher)
- MySQL/MariaDB database
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd 6thsemproject
```

### 2. Backend Setup

```bash
cd backend
npm install
```

### 3. Database Setup

Create a `.env` file in the `backend` directory:

```env
DATABASE_URL="mysql://username:password@localhost:3306/room_renting_db"
JWT_SECRET="your-secret-key-here-change-in-production"
PORT=3000
FRONTEND_URL="http://localhost:5173"
```

Replace `username`, `password`, and `room_renting_db` with your MySQL credentials and database name.

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

This will:
- Create the database schema
- Generate Prisma client

### 5. Start Backend Server

```bash
npm run dev
```

The backend server will run on `http://localhost:3000`

### 6. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

### 7. Frontend Environment Variables

Create a `.env` file in the `frontend` directory (optional, defaults are set):

```env
VITE_API_URL=http://localhost:3000/api
```

### 8. Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Database Schema

### User Model
- id (Int, Primary Key)
- email (String, Unique)
- password (String, Hashed)
- name (String, Optional)
- role (Enum: ADMIN, OWNER, TENANT)
- ownerStatus (Enum: PENDING, APPROVED, REJECTED, Optional)
- createdAt, updatedAt (DateTime)

### Room Model
- id (Int, Primary Key)
- title (String)
- description (Text)
- address, city, state, zipCode (String)
- price (Float)
- bedrooms (Int)
- bathrooms (Float)
- area (Float, Optional)
- amenities (Text)
- images (Text, Comma-separated URLs)
- isAvailable (Boolean)
- ownerId (Foreign Key to User)
- createdAt, updatedAt (DateTime)

### Booking Model
- id (Int, Primary Key)
- roomId (Foreign Key to Room)
- tenantId (Foreign Key to User)
- checkIn, checkOut (DateTime)
- status (Enum: PENDING, CONFIRMED, CANCELLED, COMPLETED)
- totalAmount (Float)
- createdAt, updatedAt (DateTime)

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user (with role selection)
- `POST /signin` - User login
- `POST /signout` - User logout

### Admin (`/api/admin`) - Requires Admin Role
- `GET /pending-owners` - Get pending owner approvals
- `POST /approve-owner/:ownerId` - Approve owner
- `POST /reject-owner/:ownerId` - Reject owner
- `GET /stats` - Get system statistics

### Owner (`/api/owner`) - Requires Approved Owner Role
- `POST /rooms` - Create new room
- `GET /rooms` - Get owner's rooms with bookings
- `GET /rooms/:roomId` - Get specific room details
- `PUT /rooms/:roomId` - Update room
- `DELETE /rooms/:roomId` - Delete room
- `PUT /bookings/:bookingId/status` - Update booking status

### Tenant (`/api/tenant`) - Requires Authentication
- `GET /rooms` - Browse available rooms (with filters)
- `GET /rooms/:roomId` - Get room details
- `POST /bookings` - Book a room (requires Tenant role)
- `GET /bookings` - Get tenant's bookings (requires Tenant role)
- `POST /bookings/:bookingId/cancel` - Cancel booking (requires Tenant role)

## Usage Guide

### Creating Your First Admin User

Since only admins can create admin users, you'll need to manually create one in the database or modify the registration endpoint temporarily.

Option 1: Using Prisma Studio (Recommended)
```bash
cd backend
npx prisma studio
```

In Prisma Studio, create a user with:
- email: admin@example.com
- password: (use the same hash format as other users - you can register a regular user first and copy the hash)
- role: ADMIN

Option 2: Using MySQL directly
```sql
-- First, register a regular user to get the password hash format
-- Then update the user role to ADMIN
UPDATE User SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

### User Workflow

1. **Register as Owner/Tenant**
   - Go to `/register`
   - Select role (Owner or Tenant)
   - Fill in details and submit

2. **Admin Approval (for Owners)**
   - Admin logs in and goes to dashboard
   - Views pending owners list
   - Approves or rejects owner accounts

3. **Owner Creates Rooms**
   - Approved owner logs in
   - Clicks "Add Room"
   - Fills in room details (title, description, address, price, etc.)
   - Saves room listing

4. **Tenant Books Room**
   - Tenant browses available rooms
   - Filters by city, price, bedrooms
   - Clicks "Book Now" on desired room
   - Selects check-in and check-out dates
   - Confirms booking

5. **Owner Manages Bookings**
   - Owner views rooms and associated bookings
   - Confirms or cancels pending bookings
   - Updates booking statuses

## Project Structure

```
6thsemproject/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── controllers/
│   │   │       └── authController.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── ownerController.js
│   │   │   └── tenantController.js
│   │   ├── lib/
│   │   │   ├── jwt.js
│   │   │   └── prisma.js
│   │   ├── middlewares/
│   │   │   ├── auth.js
│   │   │   └── role.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── admin.js
│   │       ├── owner.js
│   │       └── tenant.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── app.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── OwnerDashboard.jsx
│   │   │   └── TenantDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── auth.js
│   │   └── App.jsx
│   └── vite.config.js
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing using crypto.scryptSync
- Role-based access control (RBAC)
- Protected API routes
- Owner approval system
- CORS configuration

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses node --watch for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --name migration_name
npx prisma generate
```

### View Database (Prisma Studio)
```bash
cd backend
npx prisma studio
```

## Production Considerations

Before deploying to production:

1. **Environment Variables**
   - Set strong `JWT_SECRET`
   - Use secure database connection strings
   - Configure proper CORS origins

2. **Database**
   - Use connection pooling
   - Set up database backups
   - Use SSL connections

3. **Security**
   - Enable HTTPS
   - Add rate limiting
   - Implement request validation
   - Add input sanitization
   - Consider adding refresh tokens

4. **Error Handling**
   - Implement comprehensive error logging
   - Set up monitoring and alerts

5. **Performance**
   - Add database indexing
   - Implement caching where appropriate
   - Optimize API responses

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` in `.env` is correct
- Ensure MySQL server is running
- Check database credentials

### Prisma Client Issues
- Run `npx prisma generate` after schema changes
- Ensure migrations are up to date: `npx prisma migrate dev`

### CORS Errors
- Check `FRONTEND_URL` in backend `.env`
- Verify frontend URL matches the CORS configuration

### Authentication Issues
- Verify JWT_SECRET is set
- Check token expiration
- Ensure Authorization header format: `Bearer <token>`

## License

This project is licensed under the ISC License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue in the repository.

