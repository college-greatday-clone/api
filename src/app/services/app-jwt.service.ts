// Types
import {
	EAppJwtServiceSignType,
	TAppJwtService,
	TAppJwtServiceDecode,
	TAppJwtServiceGenerateJwtSignKey
} from './app-jwt.service.type'

// JWT
import jwt from 'jsonwebtoken'

export class AppJwtService implements TAppJwtService {
	/**
	 * @description Generate jwt sign key
	 *
	 * @param {EAppJwtServiceSignType} signType
	 *
	 * @return {string} string
	 */
	_generateJwtSignKey = (
		signType: EAppJwtServiceSignType
	): TAppJwtServiceGenerateJwtSignKey => {
		switch (signType) {
			case EAppJwtServiceSignType.LOGIN:
				return {
					jwtSignKey: process.env.JWT_KEY as string,
					expiresIn: '30d'
				}
			case EAppJwtServiceSignType.REFRESH_TOKEN:
				return {
					jwtSignKey: process.env.JWT_REFRESH_KEY as string,
					expiresIn: '30d'
				}
			case EAppJwtServiceSignType.VERIFY_USER:
				return {
					jwtSignKey: process.env.JWT_VERIFY_USER_KEY as string,
					expiresIn: '10m'
				}
			case EAppJwtServiceSignType.FORGOT_PASSWORD:
				return {
					jwtSignKey: process.env.JWT_VERIFY_FORGOT_PASSWORD_KEY as string,
					expiresIn: '10m'
				}
			default:
				return {
					jwtSignKey: signType as string,
					expiresIn: '5m'
				}
		}
	}

	/**
	 * @description Generate JWT token
	 *
	 * @param {string} payload.id
	 * @param {EAppJwtServiceSignType} signType
	 * @param {jwt.SignOptions} config
	 *
	 * @return {string} token
	 */
	generateToken = (
		payload: { id: string },
		signType: EAppJwtServiceSignType,
		config?: jwt.SignOptions
	): string => {
		return jwt.sign(payload, this._generateJwtSignKey(signType).jwtSignKey, {
			...config,
			expiresIn:
				config?.expiresIn || this._generateJwtSignKey(signType).expiresIn
		})
	}

	/**
	 * @description Decode token
	 *
	 * @param {string} token
	 *
	 * @return {TAppJwtServiceDecode} decodedToken
	 */
	decode = (token: string): TAppJwtServiceDecode => {
		return jwt.decode(token) as TAppJwtServiceDecode
	}

	/**
	 * @description Verify token
	 *
	 * @param {string} token
	 * @param {EAppJwtServiceSignType} signType
	 *
	 * @return {string} token
	 */
	verify = <T extends never>(
		token: string,
		signType: EAppJwtServiceSignType
	): Promise<T> => {
		return jwt.verify(token, this._generateJwtSignKey(signType).jwtSignKey) as T
	}
}
