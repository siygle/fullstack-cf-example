import { defineLinks } from "rwsdk/router"

export const link = defineLinks([
  "/",
  "/user/login",
  "/post/:id",
  "/admin",
  "/admin/posts",
  "/admin/post",
  "/admin/post/:id"
])
