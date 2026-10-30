import type { Request, Response, NextFunction } from "express";
import { AttendanceService } from "./attendance.service.js";
import {
  clockInSchema,
  clockOutSchema,
  listDailyAttendanceQuerySchema,
  myAttendanceQuerySchema,
  correctionRequestSchema,
  reviewCorrectionSchema,
  hrDirectCorrectionSchema,
  weeklyReportQuerySchema,
} from "./attendance.validation.js";

export class AttendanceController {
  static async clockIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { notes } = clockInSchema.parse(req.body);

      const attendance = await AttendanceService.clockIn(companyId, userId, notes);

      res.status(201).json({
        success: true,
        message: "Clock-in recorded successfully",
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  static async clockOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const { notes } = clockOutSchema.parse(req.body);

      const attendance = await AttendanceService.clockOut(companyId, userId, notes);

      res.status(200).json({
        success: true,
        message: "Clock-out recorded successfully",
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getToday(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;

      const attendance = await AttendanceService.getTodayAttendance(companyId, userId);

      res.status(200).json({
        success: true,
        message: "Today's attendance retrieved successfully",
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const query = myAttendanceQuerySchema.parse(req.query);

      const result = await AttendanceService.getMyAttendanceHistory(companyId, userId, query);

      res.status(200).json({
        success: true,
        message: "Attendance history retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDaily(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = listDailyAttendanceQuerySchema.parse(req.query);

      const result = await AttendanceService.getDailyAttendance(companyId, query);

      res.status(200).json({
        success: true,
        message: "Daily attendance log retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async requestCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const attendanceId = req.params.id as string;
      const input = correctionRequestSchema.parse(req.body);

      const correction = await AttendanceService.requestCorrection(companyId, userId, attendanceId, input);

      res.status(201).json({
        success: true,
        message: "Attendance correction request submitted successfully",
        data: { correction },
      });
    } catch (error) {
      next(error);
    }
  }

  static async listCorrectionRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const status = req.query.status as any;

      const corrections = await AttendanceService.listCorrectionRequests(companyId, status);

      res.status(200).json({
        success: true,
        message: "Correction requests retrieved successfully",
        data: { corrections },
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const correctionId = req.params.id as string;
      const { status, reviewNotes } = reviewCorrectionSchema.parse(req.body);

      const correction = await AttendanceService.reviewCorrection(
        companyId,
        userId,
        correctionId,
        status,
        reviewNotes
      );

      res.status(200).json({
        success: true,
        message: `Correction request ${status.toLowerCase()} successfully`,
        data: { correction },
      });
    } catch (error) {
      next(error);
    }
  }

  static async hrDirectCorrection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const attendanceId = req.params.id as string;
      const input = hrDirectCorrectionSchema.parse(req.body);

      const attendance = await AttendanceService.hrDirectCorrection(companyId, userId, attendanceId, input);

      res.status(200).json({
        success: true,
        message: "Attendance record corrected successfully by HR",
        data: { attendance },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getWeeklyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = weeklyReportQuerySchema.parse(req.query);

      const report = await AttendanceService.getWeeklyReport(companyId, query);

      res.status(200).json({
        success: true,
        message: "Weekly attendance report generated successfully",
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companyId = req.user!.companyId;
      const query = weeklyReportQuerySchema.parse(req.query);

      const csvContent = await AttendanceService.exportWeeklyReportCsv(companyId, query);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="attendance-report-${query.startDate}-to-${query.endDate}.csv"`
      );
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}
