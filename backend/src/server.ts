import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const port = process.env.PORT || 3001;
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const app = createApp(frontendOrigin);

app.listen(port, () => {
  console.log(`Aegis backend server listening on port ${port}`);
});
