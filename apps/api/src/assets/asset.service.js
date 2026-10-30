import prisma from "../lib/prisma.js";
import { AssetStatus, AssetAssignmentStatus, MaintenanceStatus, UserRole, } from "../generated/prisma/client.js";
function createError(message, statusCode, code) {
    const err = new Error(message);
    err.statusCode = statusCode;
    if (code)
        err.code = code;
    return err;
}
export class AssetService {
    /**
     * Create a new asset within a company.
     */
    static async createAsset(companyId, input) {
        // Check for duplicate asset code within company
        const existing = await prisma.asset.findUnique({
            where: {
                companyId_assetCode: {
                    companyId,
                    assetCode: input.assetCode,
                },
            },
        });
        if (existing) {
            throw createError(`Asset code '${input.assetCode}' already exists in this company`, 409, "CONFLICT");
        }
        const asset = await prisma.asset.create({
            data: {
                companyId,
                assetCode: input.assetCode,
                name: input.name,
                description: input.description,
                category: input.category,
                brand: input.brand,
                model: input.model,
                serialNumber: input.serialNumber,
                purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
                purchaseCost: input.purchaseCost ?? null,
                warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
                warrantyDetails: input.warrantyDetails,
                vendor: input.vendor,
                condition: input.condition,
                status: input.status || AssetStatus.AVAILABLE,
            },
        });
        return asset;
    }
    /**
     * Retrieve asset by ID with full assignment & maintenance history.
     */
    static async getAssetById(companyId, assetId, userScope) {
        const asset = await prisma.asset.findFirst({
            where: {
                id: assetId,
                companyId,
            },
            include: {
                assignedEmployee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        name: true,
                        email: true,
                        department: { select: { id: true, name: true } },
                        designation: { select: { id: true, name: true } },
                    },
                },
                assignments: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        employee: {
                            select: {
                                id: true,
                                employeeCode: true,
                                name: true,
                                email: true,
                                department: { select: { id: true, name: true } },
                            },
                        },
                        assignedBy: { select: { id: true, name: true, email: true } },
                        returnedBy: { select: { id: true, name: true, email: true } },
                    },
                },
                maintenanceTickets: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        createdBy: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });
        if (!asset) {
            throw createError("Asset not found", 404, "NOT_FOUND");
        }
        // Role-based visibility check: EMPLOYEE can only view their own allocated asset
        if (userScope?.role === UserRole.EMPLOYEE) {
            if (!userScope.employeeId || asset.assignedEmployeeId !== userScope.employeeId) {
                throw createError("Forbidden: You only have access to your own allocated assets", 403, "FORBIDDEN");
            }
        }
        return asset;
    }
    /**
     * List assets with search, filtering, and role scoping.
     */
    static async listAssets(companyId, query, userScope) {
        const { search, category, condition, status, isAvailable, employeeId, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = { companyId };
        // Role Scoping:
        // If EMPLOYEE: can only list assets assigned to themselves
        if (userScope?.role === UserRole.EMPLOYEE) {
            if (!userScope.employeeId) {
                return {
                    assets: [],
                    pagination: { total: 0, page, limit, pages: 0 },
                };
            }
            where.assignedEmployeeId = userScope.employeeId;
        }
        else if (employeeId) {
            where.assignedEmployeeId = employeeId;
        }
        if (category)
            where.category = category;
        if (condition)
            where.condition = condition;
        if (status)
            where.status = status;
        if (isAvailable !== undefined) {
            if (isAvailable) {
                where.status = AssetStatus.AVAILABLE;
                where.assignedEmployeeId = null;
            }
            else {
                where.status = { not: AssetStatus.AVAILABLE };
            }
        }
        if (search && search.trim()) {
            const term = search.trim();
            where.OR = [
                { assetCode: { contains: term, mode: "insensitive" } },
                { name: { contains: term, mode: "insensitive" } },
                { serialNumber: { contains: term, mode: "insensitive" } },
                { brand: { contains: term, mode: "insensitive" } },
                { model: { contains: term, mode: "insensitive" } },
                {
                    assignedEmployee: {
                        OR: [
                            { name: { contains: term, mode: "insensitive" } },
                            { employeeCode: { contains: term, mode: "insensitive" } },
                        ],
                    },
                },
            ];
        }
        const [assets, total] = await Promise.all([
            prisma.asset.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    assignedEmployee: {
                        select: {
                            id: true,
                            employeeCode: true,
                            name: true,
                            email: true,
                            department: { select: { id: true, name: true } },
                            designation: { select: { id: true, name: true } },
                        },
                    },
                    _count: {
                        select: {
                            assignments: true,
                            maintenanceTickets: true,
                        },
                    },
                },
            }),
            prisma.asset.count({ where }),
        ]);
        return {
            assets,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Update asset fields.
     */
    static async updateAsset(companyId, assetId, input) {
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, companyId },
        });
        if (!asset) {
            throw createError("Asset not found", 404, "NOT_FOUND");
        }
        // Check code duplication if assetCode is being changed
        if (input.assetCode && input.assetCode !== asset.assetCode) {
            const duplicate = await prisma.asset.findUnique({
                where: {
                    companyId_assetCode: {
                        companyId,
                        assetCode: input.assetCode,
                    },
                },
            });
            if (duplicate) {
                throw createError(`Asset code '${input.assetCode}' is already in use`, 409, "CONFLICT");
            }
        }
        const updated = await prisma.asset.update({
            where: { id: assetId },
            data: {
                ...(input.assetCode && { assetCode: input.assetCode }),
                ...(input.name && { name: input.name }),
                ...(input.description !== undefined && { description: input.description }),
                ...(input.category && { category: input.category }),
                ...(input.brand !== undefined && { brand: input.brand }),
                ...(input.model !== undefined && { model: input.model }),
                ...(input.serialNumber !== undefined && { serialNumber: input.serialNumber }),
                ...(input.purchaseDate !== undefined && {
                    purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
                }),
                ...(input.purchaseCost !== undefined && { purchaseCost: input.purchaseCost }),
                ...(input.warrantyExpiry !== undefined && {
                    warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
                }),
                ...(input.warrantyDetails !== undefined && { warrantyDetails: input.warrantyDetails }),
                ...(input.vendor !== undefined && { vendor: input.vendor }),
                ...(input.condition && { condition: input.condition }),
                ...(input.status && { status: input.status }),
            },
            include: {
                assignedEmployee: {
                    select: {
                        id: true,
                        employeeCode: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
        return updated;
    }
    /**
     * Delete or retire an asset.
     */
    static async deleteAsset(companyId, assetId) {
        const asset = await prisma.asset.findFirst({
            where: { id: assetId, companyId },
        });
        if (!asset) {
            throw createError("Asset not found", 404, "NOT_FOUND");
        }
        if (asset.status === AssetStatus.ASSIGNED || asset.assignedEmployeeId) {
            throw createError("Cannot delete an assigned asset. Please return it first.", 400, "BAD_REQUEST");
        }
        // Delete asset (cascade will delete assignments and maintenance tickets)
        await prisma.asset.delete({
            where: { id: assetId },
        });
        return { message: "Asset deleted successfully" };
    }
    /**
     * Summary counts for dashboard (total, available, assigned, under maintenance, retired).
     */
    static async getSummaryStats(companyId, userScope) {
        if (userScope?.role === UserRole.EMPLOYEE) {
            const empId = userScope.employeeId;
            if (!empId) {
                return { total: 0, available: 0, assigned: 0, underMaintenance: 0, retired: 0, disposed: 0 };
            }
            const myCount = await prisma.asset.count({
                where: { companyId, assignedEmployeeId: empId },
            });
            return {
                total: myCount,
                available: 0,
                assigned: myCount,
                underMaintenance: 0,
                retired: 0,
                disposed: 0,
            };
        }
        const [total, available, assigned, underMaintenance, retired, disposed] = await Promise.all([
            prisma.asset.count({ where: { companyId } }),
            prisma.asset.count({ where: { companyId, status: AssetStatus.AVAILABLE } }),
            prisma.asset.count({ where: { companyId, status: AssetStatus.ASSIGNED } }),
            prisma.asset.count({ where: { companyId, status: AssetStatus.UNDER_MAINTENANCE } }),
            prisma.asset.count({ where: { companyId, status: AssetStatus.RETIRED } }),
            prisma.asset.count({ where: { companyId, status: AssetStatus.DISPOSED } }),
        ]);
        return {
            total,
            available,
            assigned,
            underMaintenance,
            retired,
            disposed,
        };
    }
    /**
     * Get employee's own assigned assets and assignment history.
     */
    static async getMyAssets(companyId, employeeId) {
        const [currentAssets, history] = await Promise.all([
            prisma.asset.findMany({
                where: {
                    companyId,
                    assignedEmployeeId: employeeId,
                },
                orderBy: { updatedAt: "desc" },
            }),
            prisma.assetAssignment.findMany({
                where: {
                    companyId,
                    employeeId,
                },
                orderBy: { assignedDate: "desc" },
                include: {
                    asset: {
                        select: {
                            id: true,
                            assetCode: true,
                            name: true,
                            category: true,
                            brand: true,
                            model: true,
                        },
                    },
                    assignedBy: { select: { id: true, name: true } },
                    returnedBy: { select: { id: true, name: true } },
                },
            }),
        ]);
        return { currentAssets, history };
    }
    // =========================================================================
    // DAY 27: ASSIGN, RETURN, AND TRANSFER WORKFLOWS
    // =========================================================================
    /**
     * Assign an available asset to an active employee.
     */
    static async assignAsset(companyId, assetId, input, assignedById) {
        return await prisma.$transaction(async (tx) => {
            // 1. Fetch asset with lock/fresh check
            const asset = await tx.asset.findFirst({
                where: { id: assetId, companyId },
            });
            if (!asset) {
                throw createError("Asset not found in this company", 404, "NOT_FOUND");
            }
            // Check asset availability
            if (asset.status === AssetStatus.ASSIGNED || asset.assignedEmployeeId) {
                throw createError("Asset is already assigned to another employee", 409, "CONFLICT");
            }
            if (asset.status === AssetStatus.UNDER_MAINTENANCE) {
                throw createError("Asset is currently under maintenance and cannot be assigned", 400, "BAD_REQUEST");
            }
            if (asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED) {
                throw createError(`Cannot assign an asset with status '${asset.status}'`, 400, "BAD_REQUEST");
            }
            // 2. Fetch employee and verify active status
            const employee = await tx.employee.findFirst({
                where: { id: input.employeeId, companyId },
            });
            if (!employee) {
                throw createError("Employee not found in this company", 404, "NOT_FOUND");
            }
            if (employee.status !== "ACTIVE") {
                throw createError(`Cannot assign asset to employee with status '${employee.status}'`, 400, "BAD_REQUEST");
            }
            // 3. Create active assignment record
            const assignment = await tx.assetAssignment.create({
                data: {
                    companyId,
                    assetId: asset.id,
                    employeeId: employee.id,
                    assignedById,
                    assignedDate: new Date(),
                    status: AssetAssignmentStatus.ACTIVE,
                    conditionAtAssignment: input.conditionAtAssignment || asset.condition,
                    notes: input.notes,
                },
                include: {
                    employee: { select: { id: true, name: true, employeeCode: true, email: true } },
                    assignedBy: { select: { id: true, name: true } },
                },
            });
            // 4. Update asset status and assigned employee
            const updatedAsset = await tx.asset.update({
                where: { id: asset.id },
                data: {
                    status: AssetStatus.ASSIGNED,
                    assignedEmployeeId: employee.id,
                    condition: input.conditionAtAssignment || asset.condition,
                },
                include: {
                    assignedEmployee: {
                        select: { id: true, name: true, employeeCode: true, email: true },
                    },
                },
            });
            return { asset: updatedAsset, assignment };
        });
    }
    /**
     * Return an assigned asset to inventory.
     */
    static async returnAsset(companyId, assetId, input, returnedById) {
        return await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findFirst({
                where: { id: assetId, companyId },
                include: { assignedEmployee: true },
            });
            if (!asset) {
                throw createError("Asset not found", 404, "NOT_FOUND");
            }
            if (!asset.assignedEmployeeId || asset.status !== AssetStatus.ASSIGNED) {
                throw createError("Asset is not currently assigned", 400, "BAD_REQUEST");
            }
            // Find the currently active assignment
            const activeAssignment = await tx.assetAssignment.findFirst({
                where: {
                    assetId: asset.id,
                    companyId,
                    status: AssetAssignmentStatus.ACTIVE,
                },
                orderBy: { createdAt: "desc" },
            });
            const conditionAtReturn = input.conditionAtReturn || asset.condition;
            // Close the active assignment record
            if (activeAssignment) {
                await tx.assetAssignment.update({
                    where: { id: activeAssignment.id },
                    data: {
                        status: AssetAssignmentStatus.RETURNED,
                        returnDate: new Date(),
                        returnedById,
                        conditionAtReturn,
                        returnNotes: input.returnNotes,
                    },
                });
            }
            // Determine next asset status
            let nextStatus = AssetStatus.AVAILABLE;
            if (input.markMaintenance || conditionAtReturn === "DAMAGED") {
                nextStatus = AssetStatus.UNDER_MAINTENANCE;
                // Auto-create maintenance ticket if marked or damaged
                const ticketNumber = `MNT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
                await tx.assetMaintenance.create({
                    data: {
                        companyId,
                        assetId: asset.id,
                        ticketNumber,
                        issueDescription: input.maintenanceDescription ||
                            `Asset returned in ${conditionAtReturn} condition: ${input.returnNotes || "Needs inspection"}`,
                        priority: conditionAtReturn === "DAMAGED" ? "HIGH" : "MEDIUM",
                        status: MaintenanceStatus.OPEN,
                        createdById: returnedById,
                    },
                });
            }
            // Update asset record
            const updatedAsset = await tx.asset.update({
                where: { id: asset.id },
                data: {
                    assignedEmployeeId: null,
                    status: nextStatus,
                    condition: conditionAtReturn,
                },
            });
            return {
                asset: updatedAsset,
                message: `Asset returned successfully. Status is now ${nextStatus}.`,
            };
        });
    }
    /**
     * Transfer an asset from current assignee to another employee.
     */
    static async transferAsset(companyId, assetId, input, transferredById) {
        return await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findFirst({
                where: { id: assetId, companyId },
            });
            if (!asset) {
                throw createError("Asset not found", 404, "NOT_FOUND");
            }
            if (!asset.assignedEmployeeId || asset.status !== AssetStatus.ASSIGNED) {
                throw createError("Asset is not currently assigned, cannot transfer", 400, "BAD_REQUEST");
            }
            if (asset.assignedEmployeeId === input.targetEmployeeId) {
                throw createError("Asset is already assigned to this employee", 400, "BAD_REQUEST");
            }
            // Verify target employee
            const targetEmployee = await tx.employee.findFirst({
                where: { id: input.targetEmployeeId, companyId },
            });
            if (!targetEmployee) {
                throw createError("Target employee not found in this company", 404, "NOT_FOUND");
            }
            if (targetEmployee.status !== "ACTIVE") {
                throw createError(`Cannot transfer asset to employee with status '${targetEmployee.status}'`, 400, "BAD_REQUEST");
            }
            // Close previous active assignment as TRANSFERRED
            const activeAssignment = await tx.assetAssignment.findFirst({
                where: {
                    assetId: asset.id,
                    companyId,
                    status: AssetAssignmentStatus.ACTIVE,
                },
                orderBy: { createdAt: "desc" },
            });
            const condition = input.conditionAtTransfer || asset.condition;
            if (activeAssignment) {
                await tx.assetAssignment.update({
                    where: { id: activeAssignment.id },
                    data: {
                        status: AssetAssignmentStatus.TRANSFERRED,
                        returnDate: new Date(),
                        returnedById: transferredById,
                        conditionAtReturn: condition,
                        returnNotes: input.notes
                            ? `Transferred to ${targetEmployee.name} (${targetEmployee.employeeCode}): ${input.notes}`
                            : `Transferred to ${targetEmployee.name} (${targetEmployee.employeeCode})`,
                    },
                });
            }
            // Create new active assignment for target employee
            const newAssignment = await tx.assetAssignment.create({
                data: {
                    companyId,
                    assetId: asset.id,
                    employeeId: targetEmployee.id,
                    assignedById: transferredById,
                    assignedDate: new Date(),
                    status: AssetAssignmentStatus.ACTIVE,
                    conditionAtAssignment: condition,
                    notes: input.notes ? `Received via transfer: ${input.notes}` : "Received via transfer",
                },
                include: {
                    employee: { select: { id: true, name: true, employeeCode: true, email: true } },
                    assignedBy: { select: { id: true, name: true } },
                },
            });
            // Update asset record
            const updatedAsset = await tx.asset.update({
                where: { id: asset.id },
                data: {
                    assignedEmployeeId: targetEmployee.id,
                    condition,
                },
                include: {
                    assignedEmployee: {
                        select: { id: true, name: true, employeeCode: true, email: true },
                    },
                },
            });
            return { asset: updatedAsset, assignment: newAssignment };
        });
    }
    // =========================================================================
    // DAY 29: MAINTENANCE TICKETS AND STATUS
    // =========================================================================
    /**
     * Create a maintenance ticket and mark asset as UNDER_MAINTENANCE (unavailable).
     */
    static async createMaintenanceTicket(companyId, input, createdById) {
        return await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.findFirst({
                where: { id: input.assetId, companyId },
            });
            if (!asset) {
                throw createError("Asset not found", 404, "NOT_FOUND");
            }
            if (asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED) {
                throw createError(`Cannot create maintenance ticket for a ${asset.status.toLowerCase()} asset`, 400, "BAD_REQUEST");
            }
            const ticketNumber = `MNT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
            const ticket = await tx.assetMaintenance.create({
                data: {
                    companyId,
                    assetId: asset.id,
                    ticketNumber,
                    issueDescription: input.issueDescription,
                    priority: input.priority,
                    status: MaintenanceStatus.OPEN,
                    assignedTechnician: input.assignedTechnician,
                    vendor: input.vendor,
                    cost: input.cost,
                    createdById,
                },
                include: {
                    asset: { select: { id: true, assetCode: true, name: true, status: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                },
            });
            // Mark asset as UNDER_MAINTENANCE so it is unavailable for new assignments
            await tx.asset.update({
                where: { id: asset.id },
                data: { status: AssetStatus.UNDER_MAINTENANCE },
            });
            return ticket;
        });
    }
    /**
     * Update maintenance ticket (status, resolution, cost, notes).
     * Restores asset to AVAILABLE when ticket is completed or cancelled.
     */
    static async updateMaintenanceTicket(companyId, ticketId, input) {
        return await prisma.$transaction(async (tx) => {
            const ticket = await tx.assetMaintenance.findFirst({
                where: { id: ticketId, companyId },
                include: { asset: true },
            });
            if (!ticket) {
                throw createError("Maintenance ticket not found", 404, "NOT_FOUND");
            }
            const isResolving = input.status === MaintenanceStatus.COMPLETED ||
                input.status === MaintenanceStatus.CANCELLED;
            const updatedTicket = await tx.assetMaintenance.update({
                where: { id: ticketId },
                data: {
                    ...(input.status && { status: input.status }),
                    ...(input.priority && { priority: input.priority }),
                    ...(input.issueDescription && { issueDescription: input.issueDescription }),
                    ...(input.assignedTechnician !== undefined && {
                        assignedTechnician: input.assignedTechnician,
                    }),
                    ...(input.vendor !== undefined && { vendor: input.vendor }),
                    ...(input.cost !== undefined && { cost: input.cost }),
                    ...(input.resolutionNotes !== undefined && {
                        resolutionNotes: input.resolutionNotes,
                    }),
                    ...(isResolving && {
                        completedDate: input.completedDate ? new Date(input.completedDate) : new Date(),
                    }),
                },
                include: {
                    asset: { select: { id: true, assetCode: true, name: true, status: true } },
                    createdBy: { select: { id: true, name: true, email: true } },
                },
            });
            // If this ticket is completed or cancelled, check if other open tickets exist for this asset
            if (isResolving) {
                const remainingActiveTickets = await tx.assetMaintenance.count({
                    where: {
                        companyId,
                        assetId: ticket.assetId,
                        id: { not: ticketId },
                        status: { in: [MaintenanceStatus.OPEN, MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.WAITING_PARTS] },
                    },
                });
                // If no more open tickets, reinstate the asset
                if (remainingActiveTickets === 0) {
                    const assetCurrent = await tx.asset.findUnique({
                        where: { id: ticket.assetId },
                    });
                    if (assetCurrent && assetCurrent.status === AssetStatus.UNDER_MAINTENANCE) {
                        const restoredStatus = assetCurrent.assignedEmployeeId
                            ? AssetStatus.ASSIGNED
                            : AssetStatus.AVAILABLE;
                        await tx.asset.update({
                            where: { id: ticket.assetId },
                            data: { status: restoredStatus },
                        });
                    }
                }
            }
            else if (input.status === MaintenanceStatus.OPEN ||
                input.status === MaintenanceStatus.IN_PROGRESS ||
                input.status === MaintenanceStatus.WAITING_PARTS) {
                // Ensure asset stays UNDER_MAINTENANCE while ticket is active
                await tx.asset.update({
                    where: { id: ticket.assetId },
                    data: { status: AssetStatus.UNDER_MAINTENANCE },
                });
            }
            return updatedTicket;
        });
    }
    /**
     * List all maintenance tickets in company with filters & search.
     */
    static async listMaintenanceTickets(companyId, query) {
        const { search, status, priority, assetId, page, limit } = query;
        const skip = (page - 1) * limit;
        const where = { companyId };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (assetId)
            where.assetId = assetId;
        if (search && search.trim()) {
            const term = search.trim();
            where.OR = [
                { ticketNumber: { contains: term, mode: "insensitive" } },
                { issueDescription: { contains: term, mode: "insensitive" } },
                { assignedTechnician: { contains: term, mode: "insensitive" } },
                { vendor: { contains: term, mode: "insensitive" } },
                { asset: { name: { contains: term, mode: "insensitive" } } },
                { asset: { assetCode: { contains: term, mode: "insensitive" } } },
            ];
        }
        const [tickets, total] = await Promise.all([
            prisma.assetMaintenance.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    asset: {
                        select: {
                            id: true,
                            assetCode: true,
                            name: true,
                            category: true,
                            status: true,
                        },
                    },
                    createdBy: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.assetMaintenance.count({ where }),
        ]);
        return {
            tickets,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    /**
     * Get single maintenance ticket.
     */
    static async getMaintenanceTicket(companyId, ticketId) {
        const ticket = await prisma.assetMaintenance.findFirst({
            where: { id: ticketId, companyId },
            include: {
                asset: true,
                createdBy: { select: { id: true, name: true, email: true } },
            },
        });
        if (!ticket) {
            throw createError("Maintenance ticket not found", 404, "NOT_FOUND");
        }
        return ticket;
    }
}
//# sourceMappingURL=asset.service.js.map