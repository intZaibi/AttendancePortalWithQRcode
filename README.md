# AttendancePortal

AttendancePortal is a web application designed to manage attendance for students, employees, or any group requiring attendance tracking. It provides features to mark attendance, view attendance history, and manage user records.

## Features

- **User Authentication**: Secure login and registration for users.
- **Attendance Marking**: Admin/users can mark attendance for a students/employees for each day.
- **View Attendance**: Users can view their own attendance records, including present, absent, and leave statuses.
- **Data Export**: Export attendance records in excel format i.e: CSV.
- **Search and Filter**: Search attendance by user name, date.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (React.js, NEXT.js, or plain JS depending on the implementation)
- **Backend**: Node.js, Express (or another backend framework of choice)
- **Database**: MongoDB, MySQL, or PostgreSQL (depending on the database used)
- **Authentication**: JWT (JSON Web Tokens), bcrypt, js-cookie
- **Other Libraries**: xlsx, mysql2

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/intZaibi/AttendancePortal.git
cd AttendancePortal
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configuration

Create a `.env` file in the backend folder and add the following configuration:

```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=database-name
JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_BASE_URL=base-url
DB_PORT=your-preferred-port
```

### 4. Designing DataBase

In following, the sample code for MySQL database design is given. You can choose any database. 

```bash
CREATE DATABASE attendance_portal;
USE attendance_portal;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin') NOT NULL,
    profile_picture VARCHAR(255) DEFAULT NULL,
    admission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create attendance table
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('approved', 'pending', 'rejected', 'latePending', 'late') NOT NULL DEFAULT 'pending',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (user_id, date) -- Prevents duplicate attendance for the same day
);

-- Create leave_requests table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_leave_request (user_id, start_date, end_date)
);

-- Create qrcode table
CREATE TABLE qrcode (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(255) NOT NULL UNIQUE,
    date DATE NOT NULL,
    status ENUM('active', 'expired') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create total monthly_workingdays table
CREATE TABLE monthly_workingdays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(15) NOT NULL,
    working_days INT,   -- Total number of working days
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update monthly working days based on qrcode dates
DELIMITER $$

CREATE TRIGGER update_monthly_working_days
AFTER INSERT ON qrcode
FOR EACH ROW
BEGIN
    -- Extract the year and month from the inserted date
    DECLARE month_year VARCHAR(7);
    DECLARE count_working_days INT;
    DECLARE existing_count INT;
    SET month_year = DATE_FORMAT(NEW.date, '%Y-%m');

    -- Count how many rows exist for that particular year and month
    SELECT COUNT(*) INTO count_working_days
    FROM qrcode
    WHERE DATE_FORMAT(date, '%Y-%m') = month_year AND status = 'active';

    -- Check if the month already exists in the monthly_workingdays table
    SELECT COUNT(*) INTO existing_count
    FROM monthly_workingdays
    WHERE month = month_year;

    -- If the month exists, update it; otherwise, insert a new record
    IF existing_count > 0 THEN
        UPDATE monthly_workingdays
        SET working_days = count_working_days
        WHERE month = month_year;
    ELSE
        INSERT INTO monthly_workingdays (month, working_days, created_at)
        VALUES (month_year, count_working_days, NOW());
    END IF;
END $$

DELIMITER ;

-- Trigger to expire QR codes after 10 minutes
DELIMITER $$

CREATE TRIGGER expire_qrcode
AFTER INSERT ON attendance_portal.qrcode
FOR EACH ROW
BEGIN
    -- Schedule expiration after 1 minutes
    DECLARE expiration_time TIMESTAMP;
    SET expiration_time = DATE_ADD(NEW.created_at, INTERVAL 1 MINUTE);

    IF CURRENT_TIMESTAMP >= expiration_time THEN
        UPDATE attendance_portal.qrcode
        SET status = 'expired'
        WHERE id = NEW.id;
    END IF;
END $$

DELIMITER ;


DELIMITER $$

CREATE TRIGGER check_leave_request_overlap
BEFORE INSERT ON leave_requests
FOR EACH ROW
BEGIN
    -- Check for overlap with attendance dates
    IF EXISTS (
        SELECT 1
        FROM attendance
        WHERE user_id = NEW.user_id
          AND date BETWEEN NEW.start_date AND NEW.end_date
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot create leave request because there is an overlapping attendance date.';
    END IF;

    -- Check for overlap with existing leave requests
    IF EXISTS (
        SELECT 1
        FROM leave_requests
        WHERE user_id = NEW.user_id
          AND ((NEW.start_date BETWEEN start_date AND end_date)
               OR (NEW.end_date BETWEEN start_date AND end_date))
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot create leave request because there is an overlapping leave request.';
    END IF;
END $$

DELIMITER ;


DELIMITER $$

-- Creating an event to handle QR code expiration every 1 minute
CREATE EVENT expire_qr_codes
ON SCHEDULE EVERY 1 MINUTE
DO
BEGIN
  -- Updating status to 'expired' for QR codes older than 10 minutes
  UPDATE qrcode
  SET status = 'expired'
  WHERE status = 'active'
    AND TIMESTAMPDIFF(MINUTE, created_at, NOW()) >= 1;
END $$

DELIMITER ;

```

### 5. Run the Application

```bash
cd AttendancePortal
npm run dev

```
or (for build)
```
npm run start 
```

By default, the application will be available at `http://localhost:3000`.

## Usage

### Admin Features

- **Approve or Reject**: Admin can log into the application and approve/reject attendance marked/requested.
- **View Reports**: Admin can view attendance reports for the specific user and can export them to CSV or xlsx.
- **Mark working days**: Admin can mark a date as working day so that user (students, employees) can mark their attendance.
- **Admin Password**: In order to login to the admin portal use and user email and this password: admin.


### Regular User Features

- **Mark Attendance**: Users can log in and mark their individual attendance.
- **View Attendance**: Users check their individual attendance records, including history.
- **Leave Requests**: users can request for leave for specific dates.
- **Profile Picture**: users can add their profile picture.

## API Documentation

The backend exposes a REST API to handle various requests. Here are some of the key endpoints:

- `POST /api/auth/signIn(or signup)` – Login/signup to the system.
- `GET /api/viewRecords` – Get attendance data for a specific user.
- `POST /api/markAttendance` – Mark attendance for a specific user.

## Contributing

If you would like to contribute to the project, please fork the repository, create a new branch, and submit a pull request with your changes.

### Steps to Contribute:
1. Fork the repository.
2. Clone your forked repository to your local machine.
3. Create a new branch from the `main` branch.
4. Implement your changes.
5. Commit and push the changes to your forked repository.
6. Create a pull request to the `main` branch of the original repository.

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---
