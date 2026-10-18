import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  InternalKeyGuard,
  Public,
  ReportingRangeQuery,
  reportingRange,
} from '@app/common';
import type { AlertReportSnapshot } from '@app/common';
import { PrismaService } from './prisma.service.js';

@Public()
@UseGuards(InternalKeyGuard)
@Controller('internal/simon')
export class ReportingController {
  constructor(private readonly prisma: PrismaService) {}
  @Get('reports')
  async report(@Query() q: ReportingRangeQuery): Promise<AlertReportSnapshot> {
    const { timestamps } = reportingRange(q.from, q.to);
    const [
      alertsDetected,
      cases,
      currentlyOpenCases,
      firstContacts,
      actions,
      notifications,
      guardianResponses,
    ] = await Promise.all([
      this.prisma.alert.count({
        where: { schoolId: q.schoolId, detectedAt: timestamps },
      }),
      this.prisma.case.findMany({
        where: { schoolId: q.schoolId, openedAt: timestamps },
        select: { status: true, openedAt: true, firstContactAt: true },
      }),
      this.prisma.case.count({
        where: { schoolId: q.schoolId, closedAt: null },
      }),
      this.prisma.case.count({
        where: { schoolId: q.schoolId, firstContactAt: timestamps },
      }),
      this.prisma.caseAction.groupBy({
        by: ['type'],
        where: { case: { schoolId: q.schoolId }, performedAt: timestamps },
        _count: true,
      }),
      this.prisma.notification.groupBy({
        by: ['status'],
        where: {
          OR: [
            { case: { schoolId: q.schoolId } },
            { alert: { schoolId: q.schoolId } },
          ],
          createdAt: timestamps,
        },
        _count: true,
      }),
      this.prisma.guardianResponse.count({
        where: { case: { schoolId: q.schoolId }, receivedAt: timestamps },
      }),
    ]);
    const contacted = cases.filter(
      (c) => c.firstContactAt && c.firstContactAt < timestamps.lt,
    );
    return {
      schoolId: q.schoolId,
      from: q.from,
      to: q.to,
      snapshotAt: new Date().toISOString(),
      alertsDetected,
      casesOpened: cases.length,
      currentlyOpenCases,
      firstContacts,
      averageDaysToFirstContact: contacted.length
        ? Math.round(
            (contacted.reduce(
              (n, c) =>
                n +
                (c.firstContactAt!.getTime() - c.openedAt.getTime()) / 86400000,
              0,
            ) /
              contacted.length) *
              100,
          ) / 100
        : null,
      casesByStatus: cases.reduce<Record<string, number>>((out, c) => {
        out[c.status] = (out[c.status] ?? 0) + 1;
        return out;
      }, {}),
      actionsByType: Object.fromEntries(actions.map((a) => [a.type, a._count])),
      notificationsByStatus: Object.fromEntries(
        notifications.map((n) => [n.status, n._count]),
      ),
      guardianResponses,
    };
  }
}
