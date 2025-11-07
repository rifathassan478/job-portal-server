var cors = require("cors");
const jwt = require("jsonwebtoken");

const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@hobbyhub.xzkbod7.mongodb.net/?retryWrites=true&w=majority&appName=HobbyHub`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const jobs = client.db("jobs").collection("jobs");
        const applications = client.db("jobs").collection("applications");

        // JWT related api
        app.post("/jwt", (req, res) => {
            const { email } = req.body;
            const token = jwt.sign({ email }, "secret", { expiresIn: "2h" });
            res.send({ token });
        });

        // Get all jobs
        app.get("/jobs", async (req, res) => {
            const cursor = jobs.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get a single job by ID
        app.get("/job/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const job = await jobs.findOne(query);
            res.send(job);
        });

        // Job Applications related API

        // Insert an applicaton
        app.post("/applications", async (req, res) => {
            const application = req.body;
            const result = await applications.insertOne(application);
            res.send(result);
        });

        // Get applications by applicant email
        app.get("/applications", async (req, res) => {
            const email = req.query.email;
            const query = { applicant: email };
            const result = await applications.find(query).toArray();

            // Bad way to aggregate data from two collections
            for (const application of result) {
                const jobId = application.jobId;
                const job = await jobs.findOne({ _id: new ObjectId(jobId) });

                application.company = job.company;
                application.title = job.title;
            }

            res.send(result);
        });
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
