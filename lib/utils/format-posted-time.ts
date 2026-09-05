/**
 * Formats a date/timestamp into relative or short-day format:
 * - <1 min: "Posted: Just now"
 * - 1–59 min: "Posted: X min ago"
 * - 1–23 hours: "Posted: X hr ago"
 * - Previous calendar day: "Posted: Yesterday"
 * - Older: "Posted: Mon, 5 Sep"
 */
export function formatPostedTime(dateInput: string | Date | number): string {
  if (!dateInput) return 'Posted: Recently';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Posted: Recently';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  // Less than 1 min
  if (diffSec < 60) {
    return 'Posted: Just now';
  }

  // 1 to 59 mins
  if (diffMin < 60) {
    return `Posted: ${diffMin} min ago`;
  }

  // 1 to 23 hours
  if (diffHours < 24) {
    return `Posted: ${diffHours} hr ago`;
  }

  // Check if yesterday (calendar day before now)
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Posted: Yesterday';
  }

  // Older rides: 3-letter day name + date (e.g. Mon, 5 Sep)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];

  return `Posted: ${dayName}, ${dayNum} ${monthName}`;
}
