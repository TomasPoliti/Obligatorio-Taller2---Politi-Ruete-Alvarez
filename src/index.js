import express from "express";
import * as daoController from "../controllers/daoController.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_, res) => {
  res.json({ message: "API de Taller 2 lista para usarse" });
});

// DAO controllers
app.get("/dao/parameters", daoController.getParameters);
app.get("/dao/user/:address", daoController.getUserInfo);
app.get("/dao/proposals", daoController.listProposals);
app.get("/dao/proposals/:id", daoController.getProposalDetail);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
