import { ShiftService } from "./shift.service.js";
import { createShiftSchema, updateShiftSchema, listShiftsQuerySchema } from "./shift.validation.js";
export class ShiftController {
    static async list(req, res, next) {
        try {
            const companyId = req.user.companyId;
            const query = listShiftsQuerySchema.parse(req.query);
            const shifts = await ShiftService.listShifts(companyId, query);
            res.status(200).json({
                success: true,
                message: "Shifts retrieved successfully",
                data: { shifts },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getById(req, res, next) {
        try {
            const companyId = req.user.companyId;
            const shiftId = req.params.id;
            const shift = await ShiftService.getShiftById(companyId, shiftId);
            res.status(200).json({
                success: true,
                message: "Shift retrieved successfully",
                data: { shift },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async create(req, res, next) {
        try {
            const companyId = req.user.companyId;
            const validatedInput = createShiftSchema.parse(req.body);
            const shift = await ShiftService.createShift(companyId, validatedInput);
            res.status(201).json({
                success: true,
                message: "Shift created successfully",
                data: { shift },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async update(req, res, next) {
        try {
            const companyId = req.user.companyId;
            const shiftId = req.params.id;
            const validatedInput = updateShiftSchema.parse(req.body);
            const shift = await ShiftService.updateShift(companyId, shiftId, validatedInput);
            res.status(200).json({
                success: true,
                message: "Shift updated successfully",
                data: { shift },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deactivate(req, res, next) {
        try {
            const companyId = req.user.companyId;
            const shiftId = req.params.id;
            const shift = await ShiftService.deactivateShift(companyId, shiftId);
            res.status(200).json({
                success: true,
                message: "Shift deactivated successfully",
                data: { shift },
            });
        }
        catch (error) {
            next(error);
        }
    }
}
//# sourceMappingURL=shift.controller.js.map