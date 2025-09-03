
````markdown
# HTU-One Server

Backend API for the **HTU-One system**, built with **Node.js + Express + PostgreSQL**.  
This server handles **authentication**, **students**, **supervisors**, **courses**, and **course requests**.

---

## 🚀 Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/yourname/htu-one-server.git
   cd htu-one-server
````

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure database connection in `db.js`:

   ```js
   import pg from "pg";
   const client = new pg.Client({
     user: "postgres",
     password: "yourpassword",
     host: "localhost",
     port: 5432,
     database: "htu_one"
   });
   await client.connect();
   export default client;
   ```

4. Run migrations in pgAdmin/psql:

   ```sql
   -- Students and supervisors
   CREATE TABLE IF NOT EXISTS students (
     id SERIAL PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     full_name TEXT NOT NULL,
     password TEXT NOT NULL
   );

   CREATE TABLE IF NOT EXISTS supervisors (
     id SERIAL PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     full_name TEXT NOT NULL,
     password TEXT NOT NULL
   );

   -- Courses
   CREATE TABLE IF NOT EXISTS courses (
     id SERIAL PRIMARY KEY,
     course_number TEXT UNIQUE NOT NULL,
     name TEXT NOT NULL
   );

   -- Requests
   DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='request_status') THEN
       CREATE TYPE request_status AS ENUM ('pending','need_feedback','approved');
     END IF;
   END $$;

   CREATE TABLE IF NOT EXISTS requests (
     id SERIAL PRIMARY KEY,
     student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
     submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );

   CREATE TABLE IF NOT EXISTS request_preferences (
     id SERIAL PRIMARY KEY,
     request_id INT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
     course_id INT NOT NULL REFERENCES courses(id),
     student_comment TEXT,
     status request_status NOT NULL DEFAULT 'pending',
     CONSTRAINT uq_request_course UNIQUE (request_id, course_id)
   );
   ```

---

## 🔐 Auth Routes

### Signup (Student / Supervisor)

**POST** `/api/auth/signup/student`
**POST** `/api/auth/signup/supervisor`

Request body:

```json
{
  "email": "student1@htu.one",
  "fullName": "Test Student",
  "password": "1234"
}
```

Response:

```json
{
  "id": 1,
  "email": "student1@htu.one",
  "full_name": "Test Student",
  "role": "student"
}
```

---

### Login (Student / Supervisor)

**POST** `/api/auth/login`

Request body:

```json
{
  "email": "student1@htu.one",
  "password": "1234"
}
```

Response:

```json
{
  "id": 1,
  "email": "student1@htu.one",
  "full_name": "Test Student",
  "role": "student"
}
```

> Save this object in **localStorage** on the frontend.
> Example:
>
> ```js
> localStorage.setItem("user", JSON.stringify(response.data));
> ```

---

## 📚 Course Requests (Student)

A student can only have **one active request**.
When they submit a new one, it **replaces** the old request.
Each request contains **exactly 6 courses**, each with its own comment and status.

---

### Create/Replace Request

**POST** `/api/requests`

Request body:

```json
{
  "student_id": 1,
  "preferences": [
    { "courseId": 1, "comment": "Top choice" },
    { "courseId": 2, "comment": "Backup" },
    { "courseId": 3, "comment": "" },
    { "courseId": 4, "comment": "" },
    { "courseId": 5, "comment": "" },
    { "courseId": 6, "comment": "" }
  ]
}
```

Response:

```json
{
  "request": [
    {
      "request_id": 10,
      "submitted_at": "2025-09-03T18:00:00.000Z",
      "course_id": 1,
      "course_number": "CS101",
      "course_name": "Intro to Programming",
      "student_comment": "Top choice",
      "status": "pending"
    },
    { "...": "5 more rows (one per course)" }
  ]
}
```

---

### Get My Requests

**GET** `/api/requests/:student_id`

Response:

```json
[
  {
    "request_id": 10,
    "submitted_at": "2025-09-03T18:00:00.000Z",
    "course_id": 1,
    "course_number": "CS101",
    "course_name": "Intro to Programming",
    "student_comment": "Top choice",
    "status": "pending"
  },
  {
    "request_id": 10,
    "submitted_at": "2025-09-03T18:00:00.000Z",
    "course_id": 2,
    "course_number": "CS201",
    "course_name": "Data Structures",
    "student_comment": "Backup",
    "status": "pending"
  }
]
```

---

### Delete One Course from Request

**DELETE** `/api/requests/:request_id/preferences/:course_id/:student_id`

Response (updated request with remaining courses):

```json
{
  "request": [
    {
      "request_id": 10,
      "submitted_at": "2025-09-03T18:00:00.000Z",
      "course_id": 1,
      "course_number": "CS101",
      "course_name": "Intro to Programming",
      "student_comment": "Top choice",
      "status": "pending"
    }
  ]
}
```

If the course is `approved`, deletion is blocked:

```json
{ "message": "Cannot delete approved course" }
```

---

## 🛠️ Development

Start the server:

```bash
npm run dev
```

Default port: `5000`
Base URL: `http://localhost:5000/api`

```
```
