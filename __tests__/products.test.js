// By default Jest does not work with the import syntax
// If you want to use import syntax you should add NODE_OPTIONS=--experimental-vm-modules to the test script in package.json
// On Windows you cannot use NODE_OPTIONS (as well as other env vars in scripts) from the command line --> solution is to use cross-env in order to be able to pass
// env vars to command line scripts on all operative systems!
import supertest from "supertest";
import dotenv from "dotenv";
import mongoose from "mongoose";
import server from "../src/server.js";
import ProductsModel from "../src/api/products/model.js";

dotenv.config(); // This command forces .env vars to be loaded into process.env. This is the way to go when you can't use -r dotenv/config

// supertest is capable of running server.listen from our Express app if we pass the server to it
// It will give us back an object (client) that can be used to run http requests on that server
const client = supertest(server);

let validId = "6436b3e8a9cffa115e35e62c";

const notValidId = "123456123456123456123456";

const validProduct = {
  _id: validId,
  name: "iPhone",
  description: "Good phone",
  price: 10000,
};

const notValidProduct = {
  description: "Good phone",
  price: 10000,
};

const validPut = {
  name: "Edited name",
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URL);
  // const product = new ProductsModel(validProduct);
  // await product.save();
}); // beforeAll is a Jest hook which will be ran before all tests, usually this is used to connect to db and to do some initial setup like adding some mock data to the db

afterAll(async () => {
  await ProductsModel.deleteMany();
  await mongoose.connection.close();
}); // afterAll hook could to clean up the situation (close the connection to Mongo gently and clean up db/collections)

describe("Test Products APIs", () => {
  // it("Should test that GET /test endpoint returns 200 and a body containing a message", async () => {
  //   const response = await client.get("/test")
  //   expect(response.status).toBe(200)
  //   expect(response.body.message).toEqual("TEST SUCCESSFULL")
  // })
  it("Should test that env vars are loaded correctly", () => {
    expect(process.env.MONGO_TEST_URL).toBeDefined();
  });

  it("Should test that POST /products returns 201 and an _id if a valid product is provided in req.body", async () => {
    const response = await client
      .post("/products")
      .send(validProduct)
      .expect(201);
    expect(response.body._id).toBeDefined();
  });

  it("Should test that POST /products returns 400 if a not valid product is provided in req.body", async () => {
    await client.post("/products").send(notValidProduct).expect(400);
  });

  it("Should test that GET /products returns 200 and a body", async () => {
    const response = await client.get("/products").expect(200);
    console.log(response.body);
  });

  it("Should test that GET by id /products/:id returns 200 and a body", async () => {
    const response = await client.get(`/products/${validId}`).expect(200);
    console.log(response.body);
  });

  it("Should test that GET by id /products/:id returns 404 if not valid id is provided in params", async () => {
    await client.get(`/products/${notValidId}`).expect(404);
  });

  it("Should test that a product's price is a number", async () => {
    const response = await client.get(`/products/${validId}`).expect(200);
    const price = response.body.price;
    expect(typeof price).toBe("number");
  });

  it("Should test that GET /products returns 200 and a body with a price greater than 2", async () => {
    const response = await client.get("/products").expect(200);
    const price = response.body[0].price;
    expect(price).toBeGreaterThan(2);
  });

  it("Should test that product description contains 'Good'", async () => {
    const response = await client.get(`/products/${validId}`).expect(200);
    const description = response.body.description;
    expect(description).toContain("Good");
  });

  it("Should test that PUT /products/:id returns 200", async () => {
    const response = await client
      .put(`/products/${validId}`)
      .send(validPut)
      .expect(200);
    expect(response.body._id).toBeDefined();
    expect(typeof response.body.name).toBe("string");
  });

  it("Should test that PUT by id /products/:id returns 404 if not valid id is provided in params", async () => {
    await client.put(`/products/${notValidId}`).expect(404);
  });

  it("Should test that DELETE /products/:id returns 204", async () => {
    await client.delete(`/products/${validId}`).expect(204);
  });

  it("Should test that GET by id /products/:id returns 404 if not valid id is provided in params", async () => {
    await client.delete(`/products/${notValidId}`).expect(404);
  });
});
