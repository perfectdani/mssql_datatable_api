import { Router } from "express";
import MainController from "../controllers/main";

const router = Router();

router.get("/create-base-tables", MainController.createBaseTables);
router.post("/login", MainController.login);
router.post("/signup", MainController.signup);
router.post("/change-password", MainController.changePassword);
router.get("/view-log", MainController.viewLog);
router.get("/get-table-list", MainController.getTables);
router.post("/get-content", MainController.getContent);
router.post("/create-row", MainController.createRow);
router.put("/update-row", MainController.updateRow);
router.delete("/delete-row", MainController.deleteRow);

export default router;
