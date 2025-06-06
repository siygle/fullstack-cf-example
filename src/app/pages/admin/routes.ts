import { route } from "rwsdk/router"
import { Dashboard } from "./Dashboard"
import { Posts } from "./Posts"
import { PostEditor } from "./PostEditor"
import { Settings } from "./Settings"

export const adminRoutes = [
  route("/", Dashboard),
  route("/posts", Posts),
  route("/post", PostEditor),
  route("/post/:id", PostEditor),
  route("/setting", Settings),
]