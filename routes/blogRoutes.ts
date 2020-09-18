import { Express } from "express";
import redis from "redis";
import util from "util";
import mongoose from "mongoose";

const requireLogin = require("../middlewares/requireLogin");

const Blog = mongoose.model("Blog");

const redisUrl = "redis://127.0.0.1:6379";
const redisClient = redis.createClient(redisUrl);

module.exports = (app: Express) => {
  app.get("/api/blogs/:id", requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.body.user.id,
      _id: req.params.id,
    });

    res.send(blog);
  });

  app.get("/api/blogs", requireLogin, async (req, res) => {
    const blogs = await Blog.find({ _user: req.body.user.id }).cache();

    res.send(blogs);

    // Update Cache
    redisClient.set(req.body.user.id, JSON.stringify(blogs));
  });

  app.post("/api/blogs", requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.body.user.id,
    });

    try {
      await blog.save();
      res.send(blog);
    } catch (err) {
      res.send(400);
    }
  });
};
