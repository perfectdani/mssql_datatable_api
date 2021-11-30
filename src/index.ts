import app from "./app";

const port = process.env.PORT || 8888;

app.listen(port, (): void => console.log(`Server listening on Port ${port}`));
