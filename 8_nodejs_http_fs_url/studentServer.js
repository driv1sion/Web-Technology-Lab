const http = require("http");
const fs = require("fs");
const url = require("url");

// Create students.txt if it does not exist
if (!fs.existsSync("students.txt")) {
    fs.writeFileSync("students.txt", "");
}

// Create HTTP server
const server = http.createServer((req, res) => {

    const parsedUrl = url.parse(req.url, true);

    // Home page
    if (parsedUrl.pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Student Info Server</h1>");
    }

    // Display all students
    else if (parsedUrl.pathname === "/students") {
        fs.readFile("students.txt", "utf8", (err, data) => {
            res.writeHead(200, { "Content-Type": "text/html" });

            if (err) {
                res.end("<h1>Error reading student details</h1>");
            } else {
                res.end(
                    "<h1>Student Details</h1><pre>" +
                    data +
                    "</pre>"
                );
            }
        });
    }

    // Add a new student
    else if (parsedUrl.pathname === "/add") {
        const name = parsedUrl.query.name;
        const roll = parsedUrl.query.roll;
        const course = parsedUrl.query.course;

        if (name && roll && course) {
            const student =
                `Name:${name},Roll No:${roll}, Course:${course}\n`;

            fs.appendFile("students.txt", student, (err) => {
                res.writeHead(200, { "Content-Type": "text/html" });

                if (err) {
                    res.end("<h1>Error adding student</h1>");
                } else {
                    res.end("<h1>Student added successfully!</h1>");
                }
            });
        } else {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end("<h1>Please provide name, roll and course</h1>");
        }
    }

    else {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Page Not Found</h1>");
    }
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});
