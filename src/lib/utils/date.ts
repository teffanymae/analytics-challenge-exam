import dayjs from "dayjs";

export const formatDate = (dateString: string): string => {
  return dayjs(dateString).format("dddd, MMMM D, YYYY");
};

export const formatTime = (dateString: string): string => {
  return dayjs(dateString).format("hh:mm A");
};

export const formatShortDate = (dateString: string): string => {
  return dayjs(dateString).format("MMM D, YYYY");
};
