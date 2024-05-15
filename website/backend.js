const express = require("express")
const bodyParser = require("body-parser")

const app = express()

app.use(bodyParser.text())

app.get("/", (request, response) => {
    return response.sendFile("index.html", { root: "website" });
});

app.get("/auth/discord", (request, response) => {
    return response.sendFile("dashboard.html", { root: "website" });
});

app.get("/style.css", (request, response) => {
    return response.sendFile("style.css", { root: "website" });
});

app.get("/:dir/:file", (request, response) => {
    return response.sendFile(request.params.file, { root: "website/" + request.params.dir });
});

const port = "53134"; //we probably should change this
app.listen(port, () => console.log(`Website listening at http://localhost:${port}`));
