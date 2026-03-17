import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { FirebaseModule } from './common/firebase/firebase.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';
import { HealthController } from './health.controller';
import { WhoAmIModule } from './modules/whoami/whoami.module';
import { OrgsModule } from './modules/orgs/orgs.module';
import { DocumentsModule } from './documents/documents.module';
import { GapCheckModule } from './gap-check/gap-check.module';
import { AuditSummaryModule } from './audit-summary/audit-summary.module';
import { AnomalyDetectModule } from './anomaly-detect/anomaly-detect.module';
import { FirebaseService } from './common/firebase/firebase.service';

@Module({
  controllers: [HealthController],
  imports: [FirebaseModule, WhoAmIModule, OrgsModule, DocumentsModule, GapCheckModule, AuditSummaryModule, AnomalyDetectModule],
  providers: [FirebaseService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'ops/retentionSweep', method: RequestMethod.POST },
        { path: '*', method: RequestMethod.OPTIONS },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
