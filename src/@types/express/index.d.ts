// Auth Type
import { TUserJwtPayload } from '@/auth/types/auth.type'

declare global {
	namespace Express {
		interface Request {
			currentUser?: TUserJwtPayload
		}
	}
}
