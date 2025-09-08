
# HTU-One Backend (Special Topics in Computer Science 1)

This repository contains the **API server** for the **HTU-One system**, built as part of the *Special Topics in Computer Science 1* course.  

---

## 📖 Description

This backend powers the HTU-One system and provides the main API endpoints for:  

- **Authentication**  
- **Supervisors**  
- **Courses**  
- **Requests**  

It is designed to work with the [HTU-One Frontend](../htu-one-frontend) to provide a complete student–supervisor course preference management system.  

---

## 🛠️ Tech Stack

- **Node.js** + **Express** — server and routing  
- **PostgreSQL** (via `pg`) — relational database  
- **dotenv** — environment variable management  
- **cors** — cross-origin resource sharing  
- **morgan** — request logging  

---

## 📂 Project Structure

```
htu-one-server/
├── routes/
│   ├── auth.js
│   ├── courses.js
│   ├── requests.js
│   └── supervisor.js
├── middlewares/
│   └── supervisorAuth.js
├── db.js
├── server.js
└── package.json
```


- **routes/** → Defines API routes for authentication, courses, requests, and supervisors.  
- **middlewares/** → Contains middleware functions (e.g., supervisor authorization).  
- **db.js** → Database connection setup with PostgreSQL.  
- **server.js** → Entry point of the backend server.  

---

## 🚀 Getting Started

Follow these steps to set up and run the server locally:

### 1. Clone the repository
```bash
git clone <repo-link>
cd htu-one-server
````

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root of the project with the following (example) variables:

```env
PORT=5000
DATABASE_URL=postgres://username:password@localhost:5432/htu_one
JWT_SECRET=your_secret_key
```

### 4. Start the development server

```bash
npm start
```

### 5. Test the API

By default, the server will run at:

```
http://localhost:5000
```

You can now test endpoints like `/auth`, `/courses`, `/requests`, `/supervisor`.

---

## 📌 Notes

* Requires **Node.js** and **PostgreSQL** installed.
* Make sure to set correct database credentials in `.env`.
* This project is designed to work with the **htu-one-client**.


---

## 🔌 API Endpoints

> **Base URL:** `http://localhost:<PORT>/api`
> Replace `<PORT>` with your `.env` `PORT` value (e.g., `5000`).

---

### 🔑 Auth Routes

**Base:** `/api/auth`

| Method | Endpoint             | Notes                                                                            |
| ------ | -------------------- | -------------------------------------------------------------------------------- |
| POST   | `/signup/student`    | Creates a **student** (auto-assigns `supervisor_id = 1`).                        |
| POST   | `/signup/supervisor` | Creates a **supervisor**.                                                        |
| POST   | `/login`             | Logs in a user (student or supervisor). Returns `{ id, role, fullName, email }`. |

**Body Requirements:**

* **POST /signup/student**

  ```json
  { "email": "x@x.com", "fullName": "Name", "password": "secret" }
  ```
* **POST /signup/supervisor**

  ```json
  { "email": "x@x.com", "fullName": "Name", "password": "secret" }
  ```
* **POST /login**

  ```json
  { "email": "x@x.com", "password": "secret" }
  ```

---

### 📚 Courses Routes

**Base:** `/api/courses`

| Method | Endpoint | Notes                                         |
| ------ | -------- | --------------------------------------------- |
| GET    | `/`      | List all courses (`id, course_number, name`). |

---

### 📨 Requests Routes

**Base:** `/api/requests`

| Method | Endpoint                                          | Notes                                                                                                                 |
| ------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| POST   | `/`                                               | **Creates/Replaces** a request for the student. Must include **exactly 6** preferences. Status defaults to `pending`. |
| GET    | `/:student_id`                                    | Get **all requests** for a student (flat list; one row per course in a request).                                      |
| DELETE | `/:request_id/preferences/:course_id/:student_id` | Deletes **one course** from a request *iff* its status is **not** `approved`. Returns the **updated** request.        |

**Body Requirements:**

* **POST /**

  ```json
  {
    "student_id": 123,
    "preferences": [
      { "courseId": 1, "comment": "optional" },
      { "courseId": 2, "comment": null }
    ]
  }
  ```

---

### 🧑‍🏫 Supervisors Routes

**Base:** `/api/supervisors`

> These routes use `supervisorAuth` middleware (must be called as a supervisor; add your headers/cookies as required).

| Method | Endpoint                                                         | Notes                                                                                  |
| ------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| GET    | `/:supervisor_id/students`                                       | List supervisor’s students with their **latest submission** datetime.                  |
| GET    | `/:supervisor_id/requests`                                       | List **pending** request items (per course) for all supervised students.               |
| GET    | `/:supervisor_id/students/:student_id/requests`                  | List **all requests** for a specific student (flat per course).                        |
| PATCH  | `/:supervisor_id/requests/:request_id/courses/:course_id/status` | Update status for a specific course within a request. Returns the **updated** request. |

**Body Requirements:**

* **PATCH /\:supervisor\_id/requests/\:request\_id/courses/\:course\_id/status**

  ```json
  { "status": "pending" }
  ```

  Allowed values: `"pending"`, `"need_feedback"`, `"approved"`

---

