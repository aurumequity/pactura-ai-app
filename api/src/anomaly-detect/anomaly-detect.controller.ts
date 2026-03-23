import { Controller, Post, Param } from '@nestjs/common';
import { AnomalyDetectService } from './anomaly-detect.service';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('orgs/:orgId/documents/:docId/anomaly-detect')
export class AnomalyDetectController {
  constructor(private readonly anomalyDetectService: AnomalyDetectService) {}

  @Post()
  detect(
    @Param('orgId') orgId: string,
    @Param('docId') docId: string,
    @CurrentUser() user: any,
  ) {
    return this.anomalyDetectService.detectAnomalies(orgId, docId, user.uid);
  }
}
