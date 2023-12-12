// Day JS
import { ManipulateType } from 'dayjs'

export type TGetTodayNone = {
	type: 'none'
	options: undefined
}

export type TGetTodaySubtract = {
	type: 'subtract'
	options: {
		subtract: number
		manipulateType: ManipulateType
	}
}

export type TGetTodayAttrs = TGetTodayNone | TGetTodaySubtract
