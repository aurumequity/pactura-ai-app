import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseService } from '../firebase/firebase.service';
import { Action } from '../rbac/actions';
import { Role, canPerform } from '../rbac/matrix';

export const REQUIRED_ACTION_KEY = 'requiredAction';

/**
 * Decorator applied to controllers or individual route handlers to declare
 * which RBAC action is required.
 *
 * Example:
 *   @RequireAction(Actions.AUDIT_LOG_READ)
 *   @Get()
 *   listAuditLogs() { ... }
 */
export const RequireAction = (action: Action) =>
  SetMetadata(REQUIRED_ACTION_KEY, action);

/**
 * NestJS guard that enforces role-based access control using the existing
 * RBAC matrix (matrix.ts) and canPerform() helper.
 *
 * Reads the user's role from orgs/{orgId}/memberships/{uid} in Firestore.
 * Also enforces that auditors may only access GET endpoints regardless of action.
 *
 * Apply at the controller class or individual handler level:
 *   @UseGuards(RolesGuard)
 *   @RequireAction(Actions.AUDIT_LOG_READ)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly firebase: FirebaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAction = this.reflector.getAllAndOverride<Action | undefined>(
      REQUIRED_ACTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Route has no action requirement — pass through
    if (!requiredAction) return true;

    const request = context.switchToHttp().getRequest();
    const uid: string | undefined = request.user?.uid ?? request.raw?.user?.uid;

    if (!uid) {
      throw new UnauthorizedException('Unauthenticated');
    }

    const orgId: string | undefined = request.params?.orgId;
    if (!orgId) {
      throw new ForbiddenException('Missing org context');
    }

    const memberSnap = await this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('memberships')
      .doc(uid)
      .get();

    if (!memberSnap.exists) {
      throw new ForbiddenException('Not a member of this org');
    }

    const role = memberSnap.data()?.role as Role | undefined;
    if (!role) {
      throw new ForbiddenException('No role assigned');
    }

    // Auditors are strictly read-only — block any mutating HTTP method
    // regardless of what action is declared on the route.
    const method: string = request.method?.toUpperCase() ?? '';
    if (role === 'auditor' && method !== 'GET') {
      throw new ForbiddenException('Auditors have read-only access');
    }

    if (!canPerform(role, requiredAction)) {
      throw new ForbiddenException(
        `Role '${role}' does not have permission to perform '${requiredAction}'`,
      );
    }

    // Attach role so controllers/services can read it without a second Firestore fetch
    request.user.role = role;

    return true;
  }
}
