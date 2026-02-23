import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'
import { FirebaseService } from '../firebase/firebase.service'

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private firebaseService: FirebaseService) {}

  async use(req: any, res: any, next: () => void) {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header')
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded = await this.firebaseService.verifyToken(token)
      req.raw = req.raw || {}
      req.user = { uid: decoded.uid }
      next()
    } catch (err) {
      console.error('TOKEN ERROR:', err.message);
      throw new UnauthorizedException('Invalid token')
    }
  }
}