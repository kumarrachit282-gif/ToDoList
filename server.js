
require("dotenv").config();

const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// MongoDB connection
const client = new MongoClient(process.env.MONGO_URI);

let todosCollection;

async function startServer() {
    try {
        // Connect to MongoDB Atlas
        await client.connect();

        console.log("MongoDB connected successfully!");

        // Select database and collection
        const db = client.db("todoDB");
        todosCollection = db.collection("todos");

        // GET API - Fetch all tasks
        app.get("/todos", async (req, res) => {
            try {
                const todos = await todosCollection.find().toArray();
                res.json(todos);

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to fetch tasks"
                });
            }
        });

        // POST API - Add a new task
        app.post("/todos", async (req, res) => {
            try {
                const task = {
                    id: Date.now(),
                    title: req.body.title,
                    isCompleted: false,
                    createdAt: new Date()
                };

                if (
                    typeof task.title !== "string" ||
                    !task.title.trim()
                ) {
                    return res.status(400).json({
                        error: "Task title is required"
                    });
                }

                task.title = task.title.trim();

                await todosCollection.insertOne(task);

                res.json(task);

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to add task"
                });
            }
        });

        // PATCH API - Update task completion status
        app.patch("/todos/:id", async (req, res) => {
            try {
                const id = Number(req.params.id);
                const isCompleted = req.body.isCompleted;

                if (
                    !Number.isFinite(id) ||
                    typeof isCompleted !== "boolean"
                ) {
                    return res.status(400).json({
                        error: "Invalid task ID or completion status"
                    });
                }

                const result = await todosCollection.updateOne(
                    { id: id },
                    { $set: { isCompleted: isCompleted } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({
                        error: "Task not found"
                    });
                }

                res.json({
                    message: "Task updated successfully"
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to update task"
                });
            }
        });

        // PUT API - Edit an existing task
        app.put("/todos/:id", async (req, res) => {
            try {
                const id = Number(req.params.id);
                const title = req.body.title;

                if (
                    !Number.isFinite(id) ||
                    typeof title !== "string" ||
                    !title.trim()
                ) {
                    return res.status(400).json({
                        error: "Valid task ID and title are required"
                    });
                }

                const result = await todosCollection.updateOne(
                    { id: id },
                    { $set: { title: title.trim() } }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({
                        error: "Task not found"
                    });
                }

                res.json({
                    message: "Task updated successfully"
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to edit task"
                });
            }
        });

        // DELETE API - Delete a task
        app.delete("/todos/:id", async (req, res) => {
            try {
                const id = Number(req.params.id);

                const result = await todosCollection.deleteOne({
                    id: id
                });

                if (result.deletedCount === 0) {
                    return res.status(404).json({
                        error: "Task not found"
                    });
                }

                res.json({
                    message: "Task deleted successfully"
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({
                    error: "Failed to delete task"
                });
            }
        });

        // Start server
        app.listen(3000, () => {
            console.log(
                "Server running at http://localhost:3000"
            );
        });

    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    }
}

startServer();
