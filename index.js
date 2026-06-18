const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection String
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xclxgx7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    // await client.connect();

    const db = client.db("bistroresturanent");
    const menuCollection = db.collection("Menu");
    const userCollection = db.collection("Users");
    const reviewsCollection = db.collection("Reviews");
    const cartCollection = db.collection("cart");
    const paymentCollection = db.collection("Payments");
    const bookingCollection = db.collection("Bookings");



    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user) {
        isAdmin = user?.role === 'admin';
      }
      res.send({ admin: isAdmin });
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });



    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.post('/menu', async (req, res) => {
      const item = req.body;
      const result = await menuCollection.insertOne(item);
      res.send(result);
    });

    app.delete('/menu/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await menuCollection.deleteOne(query);
      res.send(result);
    });



    app.get('/cart', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/cart', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/cart/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });



    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;
    //   const result = await paymentCollection.insertOne(payment);

    //   const query = {
    //     _id: {
    //       $in: payment.cartIds.map(id => new ObjectId(id))
    //     }
    //   };
    //   const deleteResult = await cartCollection.deleteMany(query);
    //   res.send({ result, deleteResult });
    // });





    app.post('/Payments', async (req, res) => {
      try {
        const payment = req.body;

        // insert payment
        const result = await paymentCollection.insertOne(payment);

        // cart clear (VERY IMPORTANT)
        if (payment.email) {
          await cartCollection.deleteMany({ email: payment.email });
        }

        res.send(result);

      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Payment failed" });
      }
    });

    app.get('/Payments/:email', async (req, res) => {
      const query = { email: req.params.email };
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });


    app.post('/reviews', async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    app.post('/Bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.get('/Bookings', async (req, res) => {
      const email = req.query.email;
      const result = await bookingCollection.find({ email: email }).toArray();
      res.send(result);
    });

    app.get('/admin/Bookings', async (req, res) => {
      const result = await bookingCollection.find().toArray();
      res.send(result);
    });

    // FIX: Booking Status Update (Now inside run)
    app.patch('/Bookings/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { status: 'Done' },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // FIX: Booking Delete (Added)
    app.delete('/Bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });



    app.get('/user-stats/:email', async (req, res) => {
      const email = req.params.email;
      const totalPayments = await paymentCollection.countDocuments({ email: email });
      const totalReviews = await reviewsCollection.countDocuments({ email: email });
      const totalBookings = await bookingCollection.countDocuments({ email: email });
      const userPayments = await paymentCollection.find({ email: email }).toArray();
      const totalSpent = userPayments.reduce((sum, payment) => sum + payment.price, 0);

      res.send({
        orderCount: totalPayments,
        reviewCount: totalReviews,
        bookingCount: totalBookings,
        totalSpent
      });
    });

    // FIX: Admin Stats (Now inside run)
    app.get('/admin-stats', async (req, res) => {
      const users = await userCollection.estimatedDocumentCount();
      const menuItems = await menuCollection.estimatedDocumentCount();
      const orders = await paymentCollection.estimatedDocumentCount();
      const payments = await paymentCollection.find().toArray();
      const revenue = payments.reduce((sum, payment) => sum + payment.price, 0);

      const chartData = await paymentCollection.aggregate([
        { $unwind: '$menuItemIds' },
        {
          $addFields: {
            menuItemObjectId: { $toObjectId: '$menuItemIds' }
          }
        },
        {
          $lookup: {
            from: 'Menu',
            localField: 'menuItemObjectId',
            foreignField: '_id',
            as: 'menuItems'
          }
        },
        { $unwind: '$menuItems' },
        {
          $group: {
            _id: '$menuItems.category',
            quantity: { $sum: 1 },
            revenue: { $sum: '$menuItems.price' }
          }
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            quantity: 1,
            revenue: 1
          }
        }
      ]).toArray();

      res.send({ users, menuItems, orders, revenue, chartData });
    });

    // Ping confirmation
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");

  } finally {
    // Keep open
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Bistro Boss Server is running...');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;