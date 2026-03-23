import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { FirebaseModule } from '../../common/firebase/firebase.module';
import { AuditModule } from '../../common/audit/audit.module';
import { RbacMiddleware } from '../../common/middleware/rbac.middleware';
import { Actions } from '../../common/rbac/actions';
import { RemediationsController } from './remediations.controller';
import { RemediationsService } from './remediations.service';

@Module({
  imports: [FirebaseModule, AuditModule],
  controllers: [RemediationsController],
  providers: [RemediationsService],
})
export class RemediationsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RbacMiddleware(Actions.DOCUMENTS_READ))
      .forRoutes({
        path: 'orgs/:orgId/remediations',
        method: RequestMethod.GET,
      });

    consumer
      .apply(RbacMiddleware(Actions.REMEDIATIONS_CREATE))
      .forRoutes(
        { path: 'orgs/:orgId/remediations', method: RequestMethod.POST },
        { path: 'orgs/:orgId/documents/:docId/remediations/bulk-create', method: RequestMethod.POST },
      );

    consumer
      .apply(RbacMiddleware(Actions.REMEDIATIONS_UPDATE))
      .forRoutes({
        path: 'orgs/:orgId/remediations/:remediationId',
        method: RequestMethod.PATCH,
      });
  }
}