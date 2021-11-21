const express = require('express');
const app = express();
const cors = require('cors');



// process env require

require('dotenv').config()

//middle were here 

app.use(cors())
app.use(express.json())


const admin = require("firebase-admin");

const serviceAccount = require('./techLandAdminAuth.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

//mongo clients

const { MongoClient } = require('mongodb');

const ObjectId = require('mongodb').ObjectId;

// verify token here 


async function verifyToken(req, res, next) {

    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
            const decodeUser = await admin.auth().verifyIdToken(token)
            req.decodeEmail = decodeUser.email

        }

        catch {

        }
    }
    next()
}


// mongo client uri 

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1ytj1.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect()
        console.log('database connected')

        // dataBase name and collection

        const techLandDatabase = client.db("techLand");
        //dataBase for apartments
        const collectionApartment = techLandDatabase.collection("collection-techLandApartment");
        //dataBase for orderLists
        const collectionOrder = techLandDatabase.collection("collection-techLandOrder");
        // database for users 
        const collectionUsers = techLandDatabase.collection("collection-techLandUsers");
        // database for reviews
        const collectionReview = techLandDatabase.collection("collection-techLandReview");



        //get the all apartments  api
        app.get('/apartment', async (req, res) => {
            const cursor = await collectionApartment.find({}).toArray()
            res.send(cursor)
        })

        // get the selected apartment api

        app.get('/apartment/selected/:id', async (req, res) => {
            const id = req.params.id;

            const query = { _id: ObjectId(id) }
            console.log(query)
            const cursor = await collectionApartment.findOne(query)
            res.send(cursor)
            // console.log(cursor)
        })

        // post req to insert one order

        app.post('/order', async (req, res) => {
            console.log(req.body);
            const result = await collectionOrder.insertOne(req.body)
            res.send(result)
        })

        // post single user 

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await collectionUsers.insertOne(user);
            res.send(result)
        })

        // get myOrders collection

        app.get('/myOrders/:email', async (req, res) => {
            // console.log(req.params.email);
            // const query ={email: req.params.email};
            // console.log(query)
            const result = await collectionOrder.find({ email: req.params.email }).toArray()
            res.send(result)



        })

        // get all orders 
        app.get('/manageAllOrders', async (req, res) => {
            const cursor = await collectionOrder.find({}).toArray()
            res.send(cursor)

        })

        // post review here 

        app.post('/makeReview', async (req, res) => {
            const review = req.body;

            const result = await collectionReview.insertOne(review);
            res.send(result)
        })

        //Delete selected item

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const cursor = await collectionOrder.deleteOne({ _id: ObjectId(id) })
            res.send(cursor)
        })

        //make admin 

        app.put('/makeAdmin', verifyToken, async (req, res) => {
            const user = req.body;
            const requestEmail = req.decodeEmail;
            if (requestEmail) {
                const requester = await collectionUsers.findOne({ email: requestEmail })
                if (requester.role === 'admin') {
                    const filter = { email: user.email };
                    console.log(filter)
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await collectionUsers.updateOne(filter, updateDoc);
                    console.log(result)
                    res.send(result)

                }
            }
            else{
                res.statusCode(403).json({message:'access denied'})
            }


        })

        //post apartment by admin 

        app.post('/addApartment', async (req, res) => {
            console.log(req.body);
            const result = await collectionApartment.insertOne(req.body);
            res.send(result)
        })

        // admin role delete product

        app.delete('/admin/delete/:id', async (req, res) => {

            const result = await collectionApartment.deleteOne({ _id: ObjectId(req.params.id) })
            res.send(result)
        })

        //get the reviews

        app.get('/review', async (req, res) => {
            const cursor = await collectionReview.find({}).toArray();
            res.send(cursor)
        })


        // check admin

        app.get('/adminCheck/:email', async (req, res) => {
            console.log(req.params.email);
            const query = { email: req.params.email };
            const result = await collectionUsers.findOne(query);
            let isAdmin = false;
            if (result?.role === 'admin') {
                isAdmin = true;
            }

            res.send({ admin: isAdmin })
        })

        // update status

        app.put('/updateStatus/:id', async (req, res) => {
            console.log(req.params.id);
            const query = { _id: ObjectId(req.params.id) };
            const updateDoc = { $set: { status: 'approved' } };
            const result = await collectionOrder.updateOne(query, updateDoc);
            res.send(result)
        })


    }
    finally {
        // await client.close()
    }

}

run().catch(console.dir)



// port

const port = process.env.PORT || 5000;










app.get('/', (req, res) => {
    res.send('techLand server is running')
})

app.listen(port, () => {
    console.log('techLand server is running at ', port)
})



//middleWere use
app.use(cors());
app.use(express.json())