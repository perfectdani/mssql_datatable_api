import { Router } from "express";
import MainController from "../controllers/main";

const router = Router();

router.post("/login", MainController.login);
router.post("/signup", MainController.signup);
router.get("/getTables", MainController.getTables);
router.post("/getContent", MainController.getContent);
router.post("/createRow", MainController.createRow);
router.put("/updateRow", MainController.updateRow);
router.delete("/deleteRow", MainController.deleteRow);
router.get("/getLogs", MainController.getLogs);
router.post("/change-password", MainController.changePassword);

export default router;
