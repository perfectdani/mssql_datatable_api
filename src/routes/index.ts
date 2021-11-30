import { Router } from "express";
import MainController from "../controllers/main";

const router = Router();

router.get("/", MainController.home);
router.get("/getTables", MainController.getTables);
router.post("/getContent", MainController.getContent);
router.post("/createRow", MainController.createRow);
router.put("/updateRow", MainController.updateRow);
router.delete("/deleteRow", MainController.deleteRow);

export default router;
