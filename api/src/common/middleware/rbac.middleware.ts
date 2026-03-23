import { Injectable, NestMiddleware, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { mixin } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Action } from '../rbac/actions';
import { Role, canPerform } from '../rbac/matrix';

/**
 * Factory that returns a per-action RBAC middleware.
 *
 * Usage in a module's configure():
 *   consumer.apply(RbacMiddleware(Actions.DOCUMENTS_ANALYZE)).forRoutes(...)
 *
 * Expects:
 *   - req.user.uid set by AuthMiddleware
 *   - req.params.orgId present on the route
 *
 * Looks up the member document at orgs/{orgId}/members/{userId} and checks
 * the role field against the RBAC matrix.
 */
export function RbacMiddleware(requiredAction: Action) {
  @Injectable()
  class RbacCheck implements NestMiddleware {
    constructor(public readonly firebase: FirebaseService) {}

    async use(req: any, _res: any, next: () => void) {
      const uid: string | undefined = (req.raw as any)?.user?.uid;
      if (!uid) {
        throw new UnauthorizedException('Unauthenticated');
      }

      const orgId: string | undefined = req.params?.orgId;
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
      if (!role || !canPerform(role, requiredAction)) {
        throw new ForbiddenException(
          `Role '${role}' does not have permission to perform '${requiredAction}'`,
        );
      }

      // Attach role to request for downstream use
      req.user.role = role;
      next();
    }
  }

  return mixin(RbacCheck);
}