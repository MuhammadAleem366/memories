import Post from "../models/posts.js";
import mongoose from "mongoose";
export const getPosts = async (req, res) => {
  console.log("Page value is ", req.query.page);
  const page = Number(req.query.page);

  try {
    const LIMIT = 8;
    const startIndex = (page - 1) * LIMIT;
    const total = await Post.countDocuments({});
    const posts = await Post.find()
      .sort({ _id: -1 })
      .limit(LIMIT)
      .skip(startIndex);
    if (posts.length < 1) {
      res.send("No record Found");
    } else {
      res.send({
        data: posts,
        currentPage: page,
        totalPages: Math.ceil(total / LIMIT),
      });
    }
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const createPost = async (req, res) => {
  const post = req.body;
  post.tags = post.tags.split(",");

  const newPost = new Post({ ...post, creator: req.userId });
  try {
    const createdPost = await newPost.save();
    res.status(201).send(createdPost);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};
export const updatePost = async (req, res) => {
  const post = req.body;

  // post.tags = post.tags.split(",");
  const { id: _id } = req.params;
  const valid = !mongoose.Types.ObjectId.isValid(_id);

  if (valid) {
    res.status(404).send({ message: "Not a valid id" });
  } else {
    try {
      const updatedPost = await Post.findByIdAndUpdate(_id, post, {
        new: true,
      });
      res.send(updatedPost);
    } catch (error) {
      res.status(409).json({ message: error.message });
    }
  }
};

export const deletePost = async (req, res) => {
  const { id: _id } = req.params;
  const valid = !mongoose.Types.ObjectId.isValid(_id);

  if (valid) {
    res.status(404).send({ message: "Not a valid id" });
  } else {
    try {
      await Post.findByIdAndRemove(_id);

      res.status(202).send("Post Deleted");
    } catch (error) {
      res.status(409).json({ message: error.message });
    }
  }
};
export const likePost = async (req, res) => {
  const { id } = req.params;
  if (!req.userId)
    res.status(400).json({ message: "Bad Credentials Not Authenticated" });
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(404).send({ message: "Not a valid id" });
  } else {
    try {
      const post = await Post.findById(id);
      const index = post.likes.findIndex((id) => id === String(req.userId));
      if (index === -1) {
        post.likes.push(req.userId);
      } else {
        post.likes = post.likes.filter((id) => id !== String(req.userId));
      }
      const updatedPost = await Post.findByIdAndUpdate(id, post, { new: true });
      res.send(updatedPost);
    } catch (error) {
      res.status(409).json({ message: error.message });
    }
  }
};
export const getPostsBySearch = async (req, res) => {
  console.log(req.query);
  const { searchQuery, tags } = req.query;
  try {
    const title = new RegExp(searchQuery.trim(), "i");
    const posts = await Post.find({
      $or: [{ title }, { tags: { $in: tags.split(",") } }],
    });
    res.json({ data: posts });
  } catch (error) {
    res.status(404).json({ message: "Not Found" });
  }
};
