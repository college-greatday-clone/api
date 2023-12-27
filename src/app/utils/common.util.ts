// Prisma
import { AttendanceType, WorkingHourType } from '@prisma/client'

// Dayjs
import dayjs from 'dayjs'

// Types
import { TGetTodayAttrs } from './common.util.type'

export const getToday = (
	{ type, options }: TGetTodayAttrs = { type: 'none', options: undefined }
) => {
	let today = dayjs().startOf('day')

	if (type === 'subtract') {
		today = today.subtract(options.subtract, options.manipulateType)
	}

	return today.toDate()
}

export const isPastHour = (
	date: string,
	workingHour: WorkingHourType,
	attendanceType: AttendanceType
): boolean => {
	const clockInHour = workingHour === WorkingHourType.EightToFive ? 8 : 9
	const clockOutHour = workingHour === WorkingHourType.EightToFive ? 17 : 18
	const hour =
		attendanceType === AttendanceType.ClockIn ? clockInHour : clockOutHour

	// Get the current time
	const currentTime = dayjs(date)

	// Set the target time
	const targetTime = currentTime
		.set('hour', hour)
		.set('minute', 0)
		.set('second', 0)

	// Compare the current time with the target time
	if (attendanceType === AttendanceType.ClockIn) {
		return currentTime.isAfter(targetTime)
	} else {
		return currentTime.isBefore(targetTime)
	}
}
