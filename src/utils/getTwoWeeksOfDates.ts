import dayjs from 'dayjs';

export const getTwoWeeksOfDates = (): Date[] => {
  const dates: Date[] = [];
  for (let i = 0; i < 15; i += 1) {
    dates.push(dayjs().add(i, 'days').toDate());
  }
  return dates;
};
